// Vercel function that writes a short AI summary of one dashboard panel with a model hosted on Groq.
// The browser sends the panel's facts as plain text in /api/summary?facts=..., so the same facts share one
// URL and Vercel's CDN answers repeats without calling Groq again.
import { askGroq, json, keepForMonth } from "./_groq.js";

const instructions = `You brief Malaysia's Prime Minister on one panel of a daily situation dashboard.
Use only the facts given. Do not add numbers, causes, or events that are not in the facts.
Do not call a value high, low, healthy, or weak unless the facts compare it with something.
Do not say today or yesterday. Use the dates in the facts.
For news, put stories about Malaysia ahead of foreign stories.
Write 2 or 3 short sentences in plain English. Start with what most needs attention. If nothing stands out, say so.
Do not use dashes to join clauses.`;

const schema = { type: "object", properties: { summary: { type: "string" } }, required: ["summary"], additionalProperties: false };

export async function summarise(requestUrl: string, apiKey: string | undefined): Promise<Response> {
  const facts = new URL(requestUrl).searchParams.get("facts")?.trim() ?? "";
  if (!apiKey) return json({ error: "GROQ_API_KEY is not set" }, 503);
  if (!facts || facts.length > 4000) return json({ error: "Expected facts of 1 to 4000 characters" }, 400);

  const { reply, status = 502, error = "Groq returned an unexpected reply" } = await askGroq(apiKey, instructions, facts, schema, 800);
  if (typeof reply?.summary === "string" && reply.summary.trim()) return json({ summary: reply.summary.trim() }, 200, keepForMonth);
  return json({ error }, status);
}

export const GET = (request: Request) => summarise(request.url, process.env.GROQ_API_KEY);
