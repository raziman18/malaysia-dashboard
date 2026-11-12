// Vercel function that labels one headline's tone and topics with a model hosted on Groq. Each headline has its
// own URL, /api/label?title=..., and Vercel's CDN keeps the answer for 30 days, so a headline is labelled once
// however many people open the dashboard. That keeps usage inside Groq's free daily token limit.
import { askGroq, json, keepForMonth } from "./_groq.js";

const tones = ["positive", "neutral", "negative"];
// Sabah and Sarawak stories are still found by place names, which keywords match reliably.
const topics = ["flood", "health", "safety", "economy", "politics"];

// The tone guide is the same as the hand-labelled test set in src/lib/fixtures/headline-tone.txt.
const instructions = `You label Malaysian news headlines for a government situation dashboard.

Tone:
negative: the headline reports real harm or a setback, such as a disaster, death, injury, crime, arrest, fraud, loss, default, shortage, or failure.
positive: the headline reports a real benefit or improvement, such as lower prices, aid, a subsidy, an achievement, growth, or a new public service.
neutral: statements, opinions, procedures, court steps, appointments, and political back-and-forth with no clear harm or benefit.
Judge the event the headline reports, not individual words. Headlines in Malay follow the same rules.

Topics: list the topics the headline is mainly about, or none.
flood: floods, landslides, storms, and evacuations or relief after natural disasters.
health: public health, disease, hospitals, medicine, and health services.
safety: crime against the public, accidents, fires, drownings, scams, and other threats to public safety. Not political or corruption cases.
economy: the economy, business, markets, prices, trade, investment, jobs, and government budgets.
politics: parties, elections, ministers, parliament, government decisions, and court cases involving politicians.`;

const schema = {
  type: "object",
  properties: {
    tone: { type: "string", enum: tones },
    topics: { type: "array", items: { type: "string", enum: topics } },
  },
  required: ["tone", "topics"],
  additionalProperties: false,
};

export async function labelHeadline(requestUrl: string, apiKey: string | undefined): Promise<Response> {
  const title = new URL(requestUrl).searchParams.get("title")?.trim() ?? "";
  if (!apiKey) return json({ error: "GROQ_API_KEY is not set" }, 503);
  if (!title || title.length > 300) return json({ error: "Expected a headline of 1 to 300 characters" }, 400);

  const { reply, status = 502, error = "Groq returned an unexpected reply" } = await askGroq(apiKey, "openai/gpt-oss-20b", instructions, title, schema, 500);
  if (reply && tones.includes(reply.tone as string) && Array.isArray(reply.topics)) {
    return json({ tone: reply.tone, topics: reply.topics.filter((topic) => topics.includes(topic)) }, 200, keepForMonth);
  }
  return json({ error }, status);
}

export const GET = (request: Request) => labelHeadline(request.url, process.env.GROQ_API_KEY);
