import { joinGdpSeries, stateGdpShares, yearOnYearChange, type Point } from "./lib/economy.js";
import { parseRss, type Headline } from "./lib/headlines.js";
import type { Brief } from "../api/brief.js";
import type { StaplePrice } from "../api/prices.js";
import type { Parliament } from "./lib/parliament.js";
import type { DayMetrics } from "./lib/trends.js";
import { activeWarnings, type Earthquake, type FloodStation, type WeatherWarning } from "./lib/warnings.js";

// Empty in the browser. The server sets its own address, because Node cannot fetch relative URLs.
let base = "";
export const setApiBase = (url: string) => {
  base = url;
};

async function request(url: string, init?: RequestInit) {
  const response = await fetch(base + url, init);
  if (!response.ok) throw new Error(`Source returned ${response.status}`);
  return response;
}

const getJson = async <T>(url: string, init?: RequestInit): Promise<T> => (await request(url, init)).json();

const catalogue = <T>(query: string) => getJson<T[]>(`/api/gov/data-catalogue?${query}`);

interface FuelLevels {
  ron95: number;
  ron95_budi95: number;
  ron97: number;
  diesel: number;
  diesel_eastmsia: number;
}

export interface FuelPrice extends FuelLevels {
  date: string;
  weeklyChange?: FuelLevels;
}

// The latest week has two rows: price levels and the change from the week before.
export async function fetchFuelPrice(): Promise<FuelPrice> {
  const rows = await catalogue<FuelLevels & { date: string; series_type: string }>("id=fuelprice&sort=-date&limit=2");
  const level = rows.find((row) => row.series_type === "level")!;
  return { ...level, weeklyChange: rows.find((row) => row.series_type === "change_weekly" && row.date === level.date) };
}

export async function fetchInflation() {
  const rows = await catalogue<{ date: string; index: number }>("id=cpi_headline&filter=overall@division&sort=-date&limit=13");
  return { date: rows[0].date, yearOnYear: yearOnYearChange(rows.map((row) => ({ date: row.date, value: row.index }))) };
}

// Three series per quarter, so 36 rows cover the last 12 quarters.
export const fetchGdp = async () => joinGdpSeries(await catalogue<{ date: string; value: number; series: string }>("id=gdp_qtr_real&sort=-date&limit=36"));

// Annual, all sectors (p0). 17 rows a year (13 states, 3 federal territories and Supra), so 34 rows cover two years.
export const fetchStateGdp = async () =>
  stateGdpShares(await catalogue<{ date: string; state: string; value: number }>("id=gdp_state_real_supply&filter=p0@sector,abs@series&sort=-date&limit=34"));

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

// City, state as named in DOSM's boundaries, latitude, longitude.
const stateCapitals: [string, string, number, number][] = [
  ["Kuala Lumpur", "W.P. Kuala Lumpur", 3.139, 101.687], ["Putrajaya", "W.P. Putrajaya", 2.926, 101.696],
  ["Shah Alam", "Selangor", 3.073, 101.518], ["Johor Bahru", "Johor", 1.492, 103.741], ["Melaka", "Melaka", 2.189, 102.25],
  ["Seremban", "Negeri Sembilan", 2.726, 101.938], ["Ipoh", "Perak", 4.597, 101.09], ["George Town", "Pulau Pinang", 5.414, 100.329],
  ["Alor Setar", "Kedah", 6.121, 100.367], ["Kangar", "Perlis", 6.441, 100.198], ["Kota Bharu", "Kelantan", 6.125, 102.238],
  ["Kuala Terengganu", "Terengganu", 5.33, 103.137], ["Kuantan", "Pahang", 3.807, 103.326], ["Kuching", "Sarawak", 1.553, 110.359],
  ["Kota Kinabalu", "Sabah", 5.98, 116.073], ["Labuan", "W.P. Labuan", 5.28, 115.242],
];

export async function fetchAirQuality() {
  const latitudes = stateCapitals.map(([, , latitude]) => latitude).join(",");
  const longitudes = stateCapitals.map(([, , , longitude]) => longitude).join(",");
  const readings = await getJson<{ current: { us_aqi: number } }[]>(`/api/air/air-quality?latitude=${latitudes}&longitude=${longitudes}&current=us_aqi`);
  return stateCapitals.map(([city, state], index) => ({ city, state, aqi: readings[index].current.us_aqi })).sort((a, b) => b.aqi - a.aqi);
}

export const fetchBrief = () => getJson<Brief>("/api/brief");

export const fetchStaplePrices = () => getJson<StaplePrice[]>("/api/prices");

export const fetchParliament = () => getJson<Parliament>("/parliament.json");

export const fetchHistory = () => getJson<DayMetrics[]>("/history.json");

// Most of these outlets publish a photo with each story, which Google News does not. The last three are in Malay.
const newsFeeds = [
  ["Free Malaysia Today", "/api/fmt/category/nation/feed"],
  ["Free Malaysia Today", "/api/fmt/category/business/feed"],
  ["Malay Mail", "/api/malaymail/feed/rss/malaysia"],
  ["Malay Mail", "/api/malaymail/feed/rss/money"],
  ["New Straits Times", "/api/nst/feed"],
  ["Astro Awani", "/api/awani/rss/national/public"],
  ["Utusan Malaysia", "/api/utusan-nasional"],
  ["Sinar Harian", "/api/sinar/rssFeed/211"],
];

export const newsOutlets = "Free Malaysia Today, Malay Mail, New Straits Times, Astro Awani, Utusan Malaysia, Sinar Harian";

// Stories from the last 24 hours, newest first. One failing outlet does not hide the others.
export async function fetchNews(): Promise<Headline[]> {
  const feeds = await Promise.allSettled(newsFeeds.map(async ([outlet, url]) => parseRss(await (await request(url)).text(), outlet)));
  const loaded = feeds.flatMap((feed) => (feed.status === "fulfilled" ? feed.value : []));
  if (!loaded.length) throw new Error("No news outlet responded");
  const since = Date.now() - 86_400_000;
  const unique = new Map(loaded.filter((story) => story.published.getTime() >= since).map((story) => [story.link, story]));
  return [...unique.values()].sort((a, b) => b.published.getTime() - a.published.getTime());
}
