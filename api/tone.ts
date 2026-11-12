// Vercel function that labels one headline's tone with a model hosted on Groq. Each headline has its own URL,
// /api/tone?title=..., and Vercel's CDN keeps the answer for 30 days, so a headline is labelled once however
// many people open the dashboard. That keeps usage inside Groq's free daily token limit.
import { askGroq, json, keepForMonth } from "./_groq";

const tones = ["positive", "neutral", "negative"];

// Same guide as the hand-labelled test set in src/lib/fixtures/headline-tone.txt.
const instructions = `You label the tone of Malaysian news headlines for a government situation dashboard.
negative: the headline reports real harm or a setback, such as a disaster, death, injury, crime, arrest, fraud, loss, default, shortage, or failure.
positive: the headline reports a real benefit or improvement, such as lower prices, aid, a subsidy, an achievement, growth, or a new public service.
neutral: statements, opinions, procedures, court steps, appointments, and political back-and-forth with no clear harm or benefit.
Judge the event the headline reports, not individual words. Headlines in Malay follow the same rules.`;

const schema = { type: "object", properties: { tone: { type: "string", enum: tones } }, required: ["tone"], additionalProperties: false };

export async function labelTone(requestUrl: string, apiKey: string | undefined): Promise<Response> {
  const title = new URL(requestUrl).searchParams.get("title")?.trim() ?? "";
  if (!apiKey) return json({ error: "GROQ_API_KEY is not set" }, 503);
  if (!title || title.length > 300) return json({ error: "Expected a headline of 1 to 300 characters" }, 400);

  const { reply, status = 502, error = "Groq returned an unexpected reply" } = await askGroq(apiKey, instructions, title, schema, 400);
  if (reply && tones.includes(reply.tone as string)) return json({ tone: reply.tone }, 200, keepForMonth);
  return json({ error }, status);
}

export const GET = (request: Request) => labelTone(request.url, process.env.GROQ_API_KEY);
