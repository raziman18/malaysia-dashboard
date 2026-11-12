import {
  fetchBloodDonations, fetchBrief, fetchEarthquakes, fetchExchangeRates, fetchFuelPrice, fetchGdp, fetchHistory, fetchInflation,
  fetchKlci, fetchNewsReport, fetchParliament, fetchStaplePrices, fetchStateGdp, fetchUnemployment, fetchWeatherWarnings, fetchAirQuality,
} from "./api";
import { sourceHealth, type SourceCheck, type SourceHealth } from "./lib/health";
import { useFetch, type FetchState } from "./useFetch";

const check = <T>(name: string, state: FetchState<T>, dated?: (data: T) => string | undefined, maxAgeDays?: number): SourceCheck => ({
  name,
  loaded: state.data !== undefined,
  error: state.error,
  updated: state.data === undefined || !dated ? undefined : dated(state.data),
  maxAgeDays,
});

// The state of every source the dashboard reads. Panels load the same data, and useFetch shares those requests.
// The JPS river level feed is left out: it stopped in 2024 and the dashboard shows flood news instead.
export function useSourceHealth(): SourceHealth[] {
  const news = useFetch(fetchNewsReport);
  const checks: SourceCheck[] = [
    check("MET Malaysia weather warnings", useFetch(fetchWeatherWarnings)),
    check("MET Malaysia earthquakes", useFetch(fetchEarthquakes)),
    check("Open-Meteo air quality", useFetch(fetchAirQuality)),
    check("Bank Negara exchange rates", useFetch(fetchExchangeRates), (rates) => rates[0]?.date, 5),
    check("Fuel prices (data.gov.my)", useFetch(fetchFuelPrice), (fuel) => fuel.date, 10),
    check("Staple food prices (PriceCatcher)", useFetch(fetchStaplePrices), (items) => items.map((item) => item.date).sort().at(-1), 7),
    check("GDP (data.gov.my)", useFetch(fetchGdp)),
    check("State GDP (data.gov.my)", useFetch(fetchStateGdp)),
    check("Inflation (data.gov.my)", useFetch(fetchInflation)),
    check("Unemployment (data.gov.my)", useFetch(fetchUnemployment)),
    check("FBM KLCI (Yahoo Finance)", useFetch(fetchKlci), (points) => points.at(-1)?.date, 5),
    check("Blood donations (data.gov.my)", useFetch(fetchBloodDonations), (points) => points.at(-1)?.date, 7),
    ...(news.data?.outlets ?? []).map((outlet) => ({
      name: outlet.name,
      loaded: outlet.failedFeeds < outlet.totalFeeds,
      error: outlet.error && (outlet.totalFeeds > 1 ? `${outlet.failedFeeds} of ${outlet.totalFeeds} feeds failed: ${outlet.error}` : outlet.error),
    })),
    check("AI brief (Groq)", useFetch(fetchBrief), (brief) => brief.generated, 2 / 24),
    check("Parliament (refreshed by alarmpi)", useFetch(fetchParliament), (parliament) => parliament.updated, 3),
    check("Daily snapshots for trends", useFetch(fetchHistory), (days) => days.at(-1)?.date, 2),
  ];
  if (!news.data) checks.push(check("News outlets", news));
  return checks.map((item) => sourceHealth(item));
}
