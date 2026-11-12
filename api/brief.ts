// Vercel function that prepares everything the AI adds to the dashboard: tone and topic labels for current
// headlines, a summary of each panel, and a daily brief across all panels. It builds the facts from the same
// public feeds the browser uses, so visitors cannot send their own text to Groq. Vercel's CDN keeps the result
// for 30 minutes and a scheduled GitHub Action requests it every 30 minutes, so visitors get it straight away
// and Groq usage stays inside the free daily limit.
import {
  fetchAirQuality, fetchBloodDonations, fetchEarthquakes, fetchExchangeRates, fetchFloodStations, fetchFuelPrice,
  fetchGdp, fetchInflation, fetchKlci, fetchNews, fetchStaplePrices, fetchStateGdp, fetchUnemployment, fetchWeatherWarnings, setApiBase,
} from "../src/api.js";
import { economyFacts, hazardFacts, healthFacts, newsFacts } from "../src/lib/facts.js";
import type { Tone } from "../src/lib/headlines.js";
import { filterByTopic, type Topic } from "../src/lib/topics.js";
import { dayMetrics, type DayMetrics } from "../src/lib/trends.js";
import { internalKey, json } from "./_groq.js";

export interface AiLabel {
  tone: Tone;
  topics: Topic[];
}

export type BriefPanel = "daily" | "hazards" | "economy" | "health" | "news";

export interface Brief {
  labels: Record<string, AiLabel>;
  summaries: Partial<Record<BriefPanel, string>>;
  // Today's figures for the trends panel.
  metrics: Omit<DayMetrics, "date">;
  generated: string;
}

// Answers already received by this server instance. The CDN keeps them too, but not in local development.
const labelMemo = new Map<string, AiLabel>();
const summaryMemo = new Map<string, string>();

const optional = <T>(promise: Promise<T>) => promise.catch(() => undefined);
const workers = 4;
const labelTimeMs = 25_000;

export async function buildBrief(request: Request, apiKey: string | undefined): Promise<Response> {
  if (!apiKey) return json({ error: "GROQ_API_KEY is not set" }, 503);
  const origin = new URL(request.url).origin;
  setApiBase(origin);
  const ask = async <T>(path: string): Promise<T | undefined> => {
    const response = await fetch(origin + path, { headers: { "x-internal-key": internalKey(apiKey) } }).catch(() => undefined);
    return response?.ok ? response.json() : undefined;
  };

  const [news, warnings, air, stations, earthquakes, blood, rates, fuel, staples, inflation, unemployment, gdp, stateGdp, klci] = await Promise.all([
    optional(fetchNews()), optional(fetchWeatherWarnings()), optional(fetchAirQuality()), optional(fetchFloodStations()),
    optional(fetchEarthquakes()), optional(fetchBloodDonations()), optional(fetchExchangeRates()), optional(fetchFuelPrice()), optional(fetchStaplePrices()),
    optional(fetchInflation()), optional(fetchUnemployment()), optional(fetchGdp()), optional(fetchStateGdp()), optional(fetchKlci()),
  ]);

  // New headlines are labelled a few at a time. Any left when time runs out are labelled on the next run.
  const pending = [...new Set(news?.map((headline) => headline.title))].filter((title) => !labelMemo.has(title));
  const deadline = Date.now() + labelTimeMs;
  await Promise.all(
    Array.from({ length: workers }, async () => {
      while (pending.length && Date.now() < deadline) {
        const title = pending.shift()!;
        const label = await ask<AiLabel>(`/api/label?title=${encodeURIComponent(title)}`);
        if (label) labelMemo.set(title, label);
      }
    }),
  );
  const labels = Object.fromEntries((news ?? []).flatMap(({ title }) => (labelMemo.has(title) ? [[title, labelMemo.get(title)!]] : [])));
  const labelled = news?.map((headline) => ({ ...headline, ...labels[headline.title] }));

  const facts: Partial<Record<BriefPanel, string>> = {
    hazards: hazardFacts({ warnings, air, stations, floodNews: labelled && filterByTopic(labelled, "flood") }),
    economy: economyFacts({ rates, fuel, staples, gdp, inflation, unemployment, stateGdp, klci }),
    health: healthFacts({ blood, news: labelled, earthquakes }),
    news: labelled && newsFacts(labelled),
  };
  facts.daily = Object.values(facts).filter(Boolean).join("\n\n");

  const summaries: Brief["summaries"] = {};
  await Promise.all(
    Object.entries(facts).map(async ([panel, text]) => {
      if (!text) return;
      const summary = summaryMemo.get(text) ?? (await ask<{ summary: string }>(`/api/summary?facts=${encodeURIComponent(text)}`))?.summary;
      if (summary) summaryMemo.set(text, summary);
      summaries[panel as BriefPanel] = summary;
    }),
  );

  // An unfinished brief is kept only briefly, so the missing parts are filled in soon.
  const complete = Object.keys(labels).length === new Set(news?.map((headline) => headline.title)).size && Object.values(summaries).every(Boolean);
  const metrics = dayMetrics({ news: labelled, warnings, air, klci, rates });
  const brief: Brief = { labels, summaries, metrics, generated: new Date().toISOString() };
  return json(brief, 200, `public, s-maxage=${complete ? 1800 : 120}, stale-while-revalidate=86400`);
}

export const GET = (request: Request) => buildBrief(request, process.env.GROQ_API_KEY);
