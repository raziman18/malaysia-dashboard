export interface WeatherWarning {
  warning_issue: { issued: string; title_en: string };
  valid_from: string | null;
  valid_to: string | null;
  heading_en: string;
  text_en: string;
}

export interface FloodStation {
  station_name: string;
  district: string;
  state: string;
  water_level_indicator: string;
  water_level_update_datetime: string;
}

// MET Malaysia publishes local times without a time zone.
export const malaysiaTime = (local: string) => new Date(`${local.replace(" ", "T")}+08:00`);

// "No Advisory" entries have no end time and are skipped.
export function activeWarnings(warnings: WeatherWarning[], now = new Date()): WeatherWarning[] {
  return warnings
    .filter((warning) => warning.valid_to && malaysiaTime(warning.valid_to) >= now)
    .sort((a, b) => b.warning_issue.issued.localeCompare(a.warning_issue.issued));
}

const floodSeverity: Record<string, number> = { DANGER: 3, WARNING: 2, ALERT: 1 };

export function stationsAboveNormal(stations: FloodStation[]): FloodStation[] {
  return stations
    .filter((station) => station.water_level_indicator in floodSeverity)
    .sort((a, b) => floodSeverity[b.water_level_indicator] - floodSeverity[a.water_level_indicator]);
}

export interface Earthquake {
  localdatetime: string;
  location_original: string;
  n_distancemas: string;
  magdefault: number;
}

export function latestStationUpdate(stations: FloodStation[]): Date | undefined {
  const latest = stations.map((station) => station.water_level_update_datetime).filter(Boolean).sort().at(-1);
  return latest ? malaysiaTime(latest) : undefined;
}

const twoDays = 2 * 86_400_000;

// The JPS feed has stalled before, so readings older than two days are treated as unusable.
export function isFeedFresh(stations: FloodStation[], now = new Date()): boolean {
  const updated = latestStationUpdate(stations);
  return !!updated && now.getTime() - updated.getTime() <= twoDays;
}
