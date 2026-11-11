// Vercel function that labels one headline's tone with a model hosted on Groq. Each headline has its own URL,
// /api/tone?title=..., and Vercel's CDN keeps the answer for 30 days, so a headline is labelled once however
// many people open the dashboard. That keeps usage inside Groq's free daily token limit.

const model = "openai/gpt-oss-20b";
const tones = ["positive", "neutral", "negative"];

// Same guide as the hand-labelled test set in src/lib/fixtures/headline-tone.txt.
const instructions = `You label the tone of Malaysian news headlines for a government situation dashboard.
negative: the headline reports real harm or a setback, such as a disaster, death, injury, crime, arrest, fraud, loss, default, shortage, or failure.
positive: the headline reports a real benefit or improvement, such as lower prices, aid, a subsidy, an achievement, growth, or a new public service.
neutral: statements, opinions, procedures, court steps, appointments, and political back-and-forth with no clear harm or benefit.
Judge the event the headline reports, not individual words. Headlines in Malay follow the same rules.`;

const json = (body: unknown, status: number, cacheControl = "no-store") =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": cacheControl } });

export async function labelTone(requestUrl: string, apiKey: string | undefined): Promise<Response> {
  const title = new URL(requestUrl).searchParams.get("title")?.trim() ?? "";
  if (!apiKey) return json({ error: "GROQ_API_KEY is not set" }, 503);
  if (!title || title.length > 300) return json({ error: "Expected a headline of 1 to 300 characters" }, 400);

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0,
      reasoning_effort: "low",
      max_completion_tokens: 400,
      messages: [
        { role: "system", content: instructions },
        { role: "user", content: title },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "tone",
          strict: true,
          schema: { type: "object", properties: { tone: { type: "string", enum: tones } }, required: ["tone"], additionalProperties: false },
        },
      },
    }),
  });
  if (!response.ok) return json({ error: `Groq returned ${response.status}` }, response.status === 429 ? 429 : 502);

  try {
    const { choices } = await response.json();
    const { tone } = JSON.parse(choices[0].message.content);
    if (tones.includes(tone)) return json({ tone }, 200, "public, max-age=86400, s-maxage=2592000, immutable");
  } catch {
    // A cut-off or malformed reply falls through to the error below.
  }
  return json({ error: "Groq returned an unexpected reply" }, 502);
}

export const GET = (request: Request) => labelTone(request.url, process.env.GROQ_API_KEY);
