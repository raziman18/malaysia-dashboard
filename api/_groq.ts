// Shared call to a model hosted on Groq that must answer with JSON matching a schema.
// Vercel does not turn files whose names start with _ into functions.

const model = "openai/gpt-oss-20b";

export const json = (body: unknown, status: number, cacheControl = "no-store") =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": cacheControl } });

// Answers that never change for the same input, kept by the browser for a day and by Vercel's CDN for 30 days.
export const keepForMonth = "public, max-age=86400, s-maxage=2592000, immutable";

export async function askGroq(apiKey: string, system: string, user: string, schema: object, maxTokens: number) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0,
      reasoning_effort: "low",
      max_completion_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_schema", json_schema: { name: "answer", strict: true, schema } },
    }),
  });
  if (!response.ok) return { status: response.status === 429 ? 429 : 502, error: `Groq returned ${response.status}` };
  try {
    const { choices } = await response.json();
    return { reply: JSON.parse(choices[0].message.content) as Record<string, unknown> };
  } catch {
    // A cut-off or malformed reply.
    return { status: 502, error: "Groq returned an unexpected reply" };
  }
}
