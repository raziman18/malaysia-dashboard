import { toneSummary, type Headline } from "./headlines.js";
import { filterByTopic } from "./topics.js";
import type { WeatherWarning } from "./warnings.js";

// One day's figures, saved once a day into public/history.json by scripts/snapshot.mjs. A figure is missing when
// its feed failed.
export interface DayMetrics {
  date: string;
  headlines?: number;
  negativeShare?: number;
  warnings?: number;
  worstAqi?: number;
  floodStories?: number;
  klci?: number;
  usd?: number;
}

export interface MetricInputs {
  news?: Headline[];
  warnings?: WeatherWarning[];
  air?: { aqi: number }[];
  klci?: { value: number }[];
  rates?: { code: string; ringgit: number }[];
}

export function dayMetrics({ news, warnings, air, klci, rates }: MetricInputs): Omit<DayMetrics, "date"> {
  const tone = news && toneSummary(news);
  return {
    headlines: tone?.total,
    negativeShare: tone?.total ? Math.round((tone.negative / tone.total) * 1000) / 10 : undefined,
    warnings: warnings?.length,
    worstAqi: air?.length ? Math.max(...air.map((reading) => reading.aqi)) : undefined,
    floodStories: news && filterByTopic(news, "flood").length,
    klci: klci?.at(-1)?.value,
    usd: rates?.find((rate) => rate.code === "USD")?.ringgit,
  };
}
