import { yearOnYearChange, type Point } from "./lib/economy";
import { parseRss, type Headline } from "./lib/headlines";
import { activeWarnings, type Earthquake, type FloodStation, type WeatherWarning } from "./lib/warnings";

async function request(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`Source returned ${response.status}`);
  return response;
}

const getJson = async <T>(url: string, init?: RequestInit): Promise<T> => (await request(url, init)).json();

const catalogue = <T>(query: string) => getJson<T[]>(`/api/gov/data-catalogue?${query}`);

export interface FuelPrice {
  date: string;
  ron95: number;
  ron95_budi95: number;
  ron97: number;
  diesel: number;
  diesel_eastmsia: number;
}

export const fetchFuelPrice = async () => (await catalogue<FuelPrice>("id=fuelprice&filter=level@series_type&sort=-date&limit=1"))[0];

export async function fetchInflation() {
  const rows = await catalogue<{ date: string; index: number }>("id=cpi_headline&filter=overall@division&sort=-date&limit=13");
  return { date: rows[0].date, yearOnYear: yearOnYearChange(rows.map((row) => ({ date: row.date, value: row.index }))) };
}

export const fetchUnemployment = async () => (await catalogue<{ date: string; u_rate: number }>("id=lfs_month&sort=-date&limit=1"))[0];

export async function fetchExchangeRates() {
  type Rate = { currency_code: string; unit: number; rate: { date: string; middle_rate: number } };
  const { data } = await getJson<{ data: Rate[] }>("/api/bnm/exchange-rate", { headers: { Accept: "application/vnd.BNM.API.v1+json" } });
  return ["USD", "SGD", "CNY", "EUR"].flatMap((code) => {
    const match = data.find((rate) => rate.currency_code === code);
    return match ? [{ code, ringgit: match.rate.middle_rate / match.unit, date: match.rate.date }] : [];
  });
}

// Yahoo Finance's chart endpoint is unofficial and may change without notice.
export async function fetchKlci(): Promise<Point[]> {
  type Chart = { chart: { result: { timestamp: number[]; indicators: { quote: { close: (number | null)[] }[] } }[] } };
  const [result] = (await getJson<Chart>("/api/market/chart/%5EKLSE?range=1mo&interval=1d")).chart.result;
  const closes = result.indicators.quote[0].close;
  return result.timestamp.flatMap((time, index) => {
    const value = closes[index];
    return value == null ? [] : [{ date: new Date(time * 1000).toISOString().slice(0, 10), value }];
  });
}

export const fetchWeatherWarnings = async () => activeWarnings(await getJson<WeatherWarning[]>("/api/gov/weather/warning?limit=50"));

export const fetchFloodStations = () =>
  getJson<FloodStation[]>("/api/gov/flood-warning?include=station_name,district,state,water_level_indicator,water_level_update_datetime");

export const fetchEarthquakes = () => getJson<Earthquake[]>("/api/gov/weather/warning/earthquake?sort=-utcdatetime&limit=5");

export async function fetchBloodDonations(): Promise<Point[]> {
  const rows = await catalogue<{ date: string; donations: number }>("id=blood_donations&filter=all@blood_type&sort=-date&limit=30");
  return rows.map((row) => ({ date: row.date, value: row.donations })).reverse();
}

const stateCapitals: [string, number, number][] = [
  ["Kuala Lumpur", 3.139, 101.687], ["Putrajaya", 2.926, 101.696], ["Shah Alam", 3.073, 101.518],
  ["Johor Bahru", 1.492, 103.741], ["Melaka", 2.189, 102.25], ["Seremban", 2.726, 101.938],
  ["Ipoh", 4.597, 101.09], ["George Town", 5.414, 100.329], ["Alor Setar", 6.121, 100.367],
  ["Kangar", 6.441, 100.198], ["Kota Bharu", 6.125, 102.238], ["Kuala Terengganu", 5.33, 103.137],
  ["Kuantan", 3.807, 103.326], ["Kuching", 1.553, 110.359], ["Kota Kinabalu", 5.98, 116.073], ["Labuan", 5.28, 115.242],
];

export async function fetchAirQuality() {
  const latitudes = stateCapitals.map(([, latitude]) => latitude).join(",");
  const longitudes = stateCapitals.map(([, , longitude]) => longitude).join(",");
  const readings = await getJson<{ current: { us_aqi: number } }[]>(`/api/air/air-quality?latitude=${latitudes}&longitude=${longitudes}&current=us_aqi`);
  return stateCapitals.map(([city], index) => ({ city, aqi: readings[index].current.us_aqi })).sort((a, b) => b.aqi - a.aqi);
}

// These outlets publish a photo with each story, which Google News does not.
const newsFeeds = [
  ["Free Malaysia Today", "/api/fmt/category/nation/feed"],
  ["Free Malaysia Today", "/api/fmt/category/business/feed"],
  ["Malay Mail", "/api/malaymail/feed/rss/malaysia"],
  ["Malay Mail", "/api/malaymail/feed/rss/money"],
  ["New Straits Times", "/api/nst/feed"],
];

// Stories from the last 24 hours, newest first. One failing outlet does not hide the others.
export async function fetchNews(): Promise<Headline[]> {
  const feeds = await Promise.allSettled(newsFeeds.map(async ([outlet, url]) => parseRss(await (await request(url)).text(), outlet)));
  const loaded = feeds.flatMap((feed) => (feed.status === "fulfilled" ? feed.value : []));
  if (!loaded.length) throw new Error("No news outlet responded");
  const since = Date.now() - 86_400_000;
  const unique = new Map(loaded.filter((story) => story.published.getTime() >= since).map((story) => [story.link, story]));
  return [...unique.values()].sort((a, b) => b.published.getTime() - a.published.getTime());
}
