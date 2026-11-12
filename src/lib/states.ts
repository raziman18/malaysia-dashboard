import type { Headline } from "./headlines.js";
import { airQualityBand, type Status } from "./status.js";
import { topics } from "./topics.js";
import { isFeedFresh, stationsAboveNormal, type FloodStation, type WeatherWarning } from "./warnings.js";

// Names as in DOSM's boundaries, with the other spellings news and MET Malaysia use.
export const stateNames: Record<string, RegExp> = {
  Johor: /\bJohor\b/i,
  Kedah: /\bKedah\b/i,
  Kelantan: /\bKelantan\b/i,
  Melaka: /\b(Melaka|Malacca)\b/i,
  "Negeri Sembilan": /\b(Negeri|N\.) ?Sembilan\b/i,
  Pahang: /\bPahang\b/i,
  Perak: /\bPerak\b/i,
  Perlis: /\bPerlis\b/i,
  "Pulau Pinang": /\b(Pulau Pinang|Penang|P\. Pinang)\b/i,
  Sabah: /\bSabah\b/i,
  Sarawak: /\bSarawak\b/i,
  Selangor: /\b(Selangor|S'gor)\b/i,
  Terengganu: /\bTerengganu\b/i,
  "W.P. Kuala Lumpur": /\bKuala Lumpur\b/i,
  "W.P. Labuan": /\bLabuan\b/i,
  "W.P. Putrajaya": /\bPutrajaya\b/i,
};

export interface StateIssues {
  status: Status;
  reasons: string[];
}

export const rank: Record<Status, number> = { good: 0, warning: 1, serious: 2, critical: 3 };
const floodLevel: Record<string, Status> = { DANGER: "critical", WARNING: "serious", ALERT: "warning" };

export interface StateInputs {
  warnings?: WeatherWarning[];
  air?: { city: string; state: string; aqi: number }[];
  stations?: FloodStation[];
  floodNews?: Headline[];
}

// The worst current issue in each state, with every reason. States with no issue are left out.
// Sea warnings name the coastal waters of a state, so they count as a lower level than warnings on land.
// Moderate air is common, so only air that is unhealthy for sensitive groups or worse counts.
export function stateIssues({ warnings, air, stations, floodNews }: StateInputs): Map<string, StateIssues> {
  const issues = new Map<string, StateIssues>();
  const add = (state: string, status: Status, reason: string) => {
    const current = issues.get(state) ?? { status, reasons: [] };
    if (rank[status] > rank[current.status]) current.status = status;
    if (!current.reasons.includes(reason)) current.reasons.push(reason);
    issues.set(state, current);
  };
  const mentioned = (text: string) => Object.keys(stateNames).filter((state) => stateNames[state].test(text));

  for (const warning of warnings ?? []) {
    const title = warning.warning_issue.title_en;
    const atSea = /seas/i.test(title);
    mentioned(warning.text_en).forEach((state) => add(state, atSea ? "warning" : "serious", atSea ? `${title} (coastal waters)` : title));
  }
  for (const { city, state, aqi } of air ?? []) {
    const band = airQualityBand(aqi);
    if (rank[band.status] >= rank.serious) add(state, band.status, `Air quality ${aqi} in ${city} (${band.label})`);
  }
  if (stations && isFeedFresh(stations)) {
    for (const station of stationsAboveNormal(stations)) {
      const [state] = mentioned(station.state.replace(/^WP /i, ""));
      if (state) add(state, floodLevel[station.water_level_indicator], `River ${station.water_level_indicator.toLowerCase()}: ${station.station_name}`);
    }
  }
  // A story must also use a flood word, so a mislabelled story cannot put a state on the map.
  for (const story of (floodNews ?? []).filter((item) => topics.flood.test(item.title))) {
    mentioned(story.title).forEach((state) => add(state, "serious", `Flood news: ${story.title}`));
  }
  return issues;
}
