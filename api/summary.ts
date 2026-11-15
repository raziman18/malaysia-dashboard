// Vercel function that writes a short AI summary of one dashboard panel, or of one bill, with a model hosted on Groq.
// /api/brief sends the facts as plain text in /api/summary?facts=..., so the same facts share one URL and
// Vercel's CDN answers repeats without calling Groq again.
import { askGroq, json, isInternal, keepForMonth } from "./_groq.js";

const instructions = `You brief Malaysia's Prime Minister on one panel of a daily situation dashboard, or on all of them.
Use only the facts given. Do not add numbers, causes, or events that are not in the facts.
Do not call a value high, low, healthy, or weak unless the facts compare it with something.
Do not say a value rose, fell, or stayed the same unless the facts give the change.
Do not say today or yesterday. Use the dates in the facts.
For news, put stories about Malaysia ahead of foreign stories.
Write 2 or 3 short sentences in plain English, or 3 or 4 when the facts cover several panels. Start with what most needs attention. If nothing stands out, say so.
Do not use dashes to join clauses.`;

// For /api/summary?kind=bill, the facts are a bill's title and the explanatory statement from its text.
const billInstructions = `You explain a bill before Malaysia's Parliament to a busy reader.
Use only the bill's title and explanatory statement given. Do not add effects, reasons, or opinions that are not in them.
Keep the statement's own verbs. Say the bill creates or establishes something only if the statement says so; "provides for the functions of" an existing body does not create it.
Write 2 short sentences in plain English: what the bill does, and who or what it mainly affects.
Name the law it amends or replaces, if any. Skip clause numbers, the short title, and commencement.
Do not use dashes to join clauses.`;

const schema = { type: "object", properties: { summary: { type: "string" } }, required: ["summary"], additionalProperties: false };

export async function summarise(request: Request, apiKey: string | undefined): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const facts = searchParams.get("facts")?.trim() ?? "";
  const system = searchParams.get("kind") === "bill" ? billInstructions : instructions;
  if (!apiKey) return json({ error: "GROQ_API_KEY is not set" }, 503);
  if (!isInternal(request, apiKey)) return json({ error: "Only /api/brief can call this route" }, 403);
  if (!facts || facts.length > 8000) return json({ error: "Expected facts of 1 to 8000 characters" }, 400);

  const { reply, status = 502, error = "Groq returned an unexpected reply" } = await askGroq(apiKey, "openai/gpt-oss-120b", system, facts, schema, 800);
  if (typeof reply?.summary === "string" && reply.summary.trim()) return json({ summary: reply.summary.trim() }, 200, keepForMonth);
  return json({ error }, status);
}

export const GET = (request: Request) => summarise(request, process.env.GROQ_API_KEY);
