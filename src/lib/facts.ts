import type { FuelPrice } from "../api.js";
import { percentChange, type GdpQuarter, type Point, type StateGdp } from "./economy.js";
import { dayLabel, monthLabel, quarterLabel, ringgit, ringgitBillions, signedPercent, timeLabel } from "./format.js";
import type { Headline } from "./headlines.js";
import { airQualityBand } from "./status.js";
import { filterByTopic } from "./topics.js";
import { isFeedFresh, malaysiaTime, stationsAboveNormal, type Earthquake, type FloodStation, type WeatherWarning } from "./warnings.js";

// Plain-text facts that the AI summarises for each panel. The text is also the cache key for /api/summary,
// so it holds only values that change when the underlying data changes, never the current time.

const headlineLines = (heading: string, headlines: Headline[], limit = 5) =>
  headlines.length ? [`${heading}:`, ...headlines.slice(0, limit).map((headline) => `- ${headline.title}`)] : [`${heading}: none`];

export interface EconomyData {
  rates?: { code: string; ringgit: number }[];
  fuel?: FuelPrice;
  gdp?: GdpQuarter[];
  inflation?: { date: string; yearOnYear?: number };
  unemployment?: { date: string; u_rate: number };
  stateGdp?: { year: string; states: StateGdp[] };
  klci?: Point[];
}

export function economyFacts({ rates, fuel, gdp, inflation, unemployment, stateGdp, klci }: EconomyData): string {
  const lines = ["Panel: Economy"];
  if (rates) lines.push(`Ringgit per foreign unit, BNM middle rate: ${rates.map((rate) => `${rate.code} ${ringgit(rate.ringgit, 4)}`).join(", ")}`);
  if (fuel) {
    lines.push(`Fuel prices, week of ${dayLabel(fuel.date)}: RON95 (BUDI95) ${ringgit(fuel.ron95_budi95)}, unsubsidised RON95 ${ringgit(fuel.ron95)}, diesel Peninsular ${ringgit(fuel.diesel)}, East Malaysia ${ringgit(fuel.diesel_eastmsia)}`);
  }
  if (gdp && gdp.length >= 2) {
    const [previous, latest] = gdp.slice(-2);
    lines.push(`Real GDP ${quarterLabel(latest.date)}: ${ringgitBillions(latest.ringgitMillions)}, ${signedPercent(latest.growth)} year on year (previous quarter ${signedPercent(previous.growth)})`);
  }
  if (inflation?.yearOnYear !== undefined) lines.push(`Inflation ${monthLabel(inflation.date)}: ${inflation.yearOnYear.toFixed(1)}% year on year`);
  if (unemployment) lines.push(`Unemployment rate ${monthLabel(unemployment.date)}: ${unemployment.u_rate}%`);
  if (stateGdp) {
    const growing = stateGdp.states.filter((item) => item.growth !== undefined).sort((a, b) => b.growth! - a.growth!);
    const [largest] = stateGdp.states;
    lines.push(`State GDP ${stateGdp.year}: largest ${largest.state} (${largest.share.toFixed(1)}% of national GDP)`);
    if (growing.length) lines.push(`State GDP growth ${stateGdp.year}: fastest ${growing[0].state} ${signedPercent(growing[0].growth!)}, slowest ${growing.at(-1)!.state} ${signedPercent(growing.at(-1)!.growth!)}`);
  }
  if (klci && klci.length >= 2) {
    const first = klci[0];
    const last = klci.at(-1)!;
    const values = klci.map((point) => point.value);
    lines.push(`FBM KLCI: latest close ${last.value.toFixed(2)} on ${last.date}, ${signedPercent(percentChange(last.value, first.value))} since ${first.date}; this month's low ${Math.min(...values).toFixed(2)}, high ${Math.max(...values).toFixed(2)}`);
  }
  return lines.join("\n");
}

export interface HazardData {
  warnings?: WeatherWarning[];
  air?: { city: string; aqi: number }[];
  stations?: FloodStation[];
  floodNews?: Headline[];
}

export function hazardFacts({ warnings, air, stations, floodNews }: HazardData): string {
  const lines = ["Panel: Disasters and weather"];
  if (warnings) {
    const active = warnings.map((warning) => `- ${warning.warning_issue.title_en}: ${warning.heading_en}, until ${timeLabel(malaysiaTime(warning.valid_to!))}`);
    lines.push(...(active.length ? ["Active weather warnings:", ...active] : ["Active weather warnings: none"]));
  }
  if (air) lines.push(`Worst air quality by state capital (US AQI): ${air.slice(0, 3).map(({ city, aqi }) => `${city} ${aqi} (${airQualityBand(aqi).label})`).join(", ")}`);
  if (stations && isFeedFresh(stations)) {
    const high = stationsAboveNormal(stations);
    lines.push(`River stations above normal level: ${high.length}`, ...high.slice(0, 5).map((station) => `- ${station.station_name}, ${station.state}: ${station.water_level_indicator}`));
  }
  if (floodNews) lines.push(...headlineLines("Flood news, last 24 hours", floodNews));
  return lines.join("\n");
}

export interface HealthData {
  blood?: Point[];
  news?: Headline[];
  earthquakes?: Earthquake[];
}

export function healthFacts({ blood, news, earthquakes }: HealthData): string {
  const lines = ["Panel: Public health and safety"];
  if (blood?.length) {
    const latest = blood.at(-1)!;
    const average = blood.reduce((sum, point) => sum + point.value, 0) / blood.length;
    lines.push(`Blood donations: ${latest.value} on ${latest.date}, ${Math.round(average)} a day on average over ${blood.length} days`);
  }
  if (news) lines.push(...headlineLines("Health news", filterByTopic(news, "health")), ...headlineLines("Safety and incident news", filterByTopic(news, "safety")));
  if (earthquakes) {
    lines.push("Recent earthquakes in the region:", ...earthquakes.slice(0, 3).map((quake) => `- M${quake.magdefault.toFixed(1)} ${quake.location_original} (${quake.n_distancemas}), ${dayLabel(malaysiaTime(quake.localdatetime))}`));
  }
  return lines.join("\n");
}

export const newsFacts = (news: Headline[]) => ["Panel: News", ...headlineLines("Top stories, last 24 hours, newest first", news, 15)].join("\n");
