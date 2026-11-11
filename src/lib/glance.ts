import { percentChange, type Point } from "./economy";
import { ringgit } from "./format";
import { toneSummary, type Headline } from "./headlines";
import { airQualityBand, type Status } from "./status";
import { isFeedFresh, malaysiaTime, stationsAboveNormal, type Earthquake, type FloodStation, type WeatherWarning } from "./warnings";

export interface GlanceItem {
  id: string;
  label: string;
  value: string;
  detail: string;
  badge?: { status: Status; label: string };
  priority: number;
}

export interface GlanceInputs {
  warnings?: WeatherWarning[];
  air?: { city: string; aqi: number }[];
  usdRate?: number;
  topNews?: Headline[];
  floodStations?: FloodStation[];
  floodNews?: Headline[];
  earthquakes?: Earthquake[];
  klci?: Point[];
}

const day = 86_400_000;
const airPriority: Record<Status, number> = { good: 0, warning: 1, serious: 3, critical: 4 };
const floodPriority: Record<string, number> = { DANGER: 4, WARNING: 3, ALERT: 2 };

function quakePriority({ magdefault, n_distancemas }: Earthquake) {
  const distanceKm = Number.parseFloat(n_distancemas.replace(/,/g, ""));
  if (magdefault >= 6 && distanceKm <= 1500) return 4;
  if (magdefault >= 5 && distanceKm <= 500) return 3;
  return 0;
}

// The first four are always available and fill the strip on a quiet day. The rest appear only when a rule fires.
function candidates(input: GlanceInputs, now: Date): GlanceItem[] {
  const { warnings, air, usdRate, topNews, floodStations, floodNews, earthquakes, klci } = input;
  const items: GlanceItem[] = [];

  if (warnings) {
    items.push({ id: "weather", label: "Weather warnings", value: String(warnings.length), detail: warnings[0]?.warning_issue.title_en ?? "None active", priority: warnings.length ? 2 : 0 });
  }
  if (air?.length) {
    const [worst] = air;
    const band = airQualityBand(worst.aqi);
    items.push({ id: "air", label: "Worst air quality", value: String(worst.aqi), detail: worst.city, badge: band, priority: airPriority[band.status] });
  }
  if (usdRate !== undefined) {
    items.push({ id: "ringgit", label: "USD / MYR", value: ringgit(usdRate, 4), detail: "BNM middle rate", priority: 0 });
  }
  if (topNews) {
    const tone = toneSummary(topNews.map((headline) => headline.title));
    const negativeShare = tone.total ? tone.negative / tone.total : 0;
    items.push({ id: "headlines", label: "Negative headlines", value: `${tone.negative} / ${tone.total}`, detail: "All stories, last 24 hours", priority: negativeShare >= 0.3 ? 2 : 0 });
  }

  const risingRivers = floodStations && isFeedFresh(floodStations, now) ? stationsAboveNormal(floodStations) : [];
  if (risingRivers.length) {
    const [worst] = risingRivers;
    const status = worst.water_level_indicator === "DANGER" ? "critical" : "serious";
    items.push({
      id: "rivers",
      label: "Rivers above normal",
      value: String(risingRivers.length),
      detail: `${worst.station_name}, ${worst.state}`,
      badge: { status, label: worst.water_level_indicator },
      priority: floodPriority[worst.water_level_indicator],
    });
  } else if (floodNews && floodNews.length >= 3) {
    items.push({ id: "flood-news", label: "Flood reports, last 24 hours", value: String(floodNews.length), detail: floodNews[0].title, priority: 2 });
  }

  const quake = earthquakes
    ?.filter((item) => now.getTime() - malaysiaTime(item.localdatetime).getTime() <= day && quakePriority(item) > 0)
    .sort((a, b) => quakePriority(b) - quakePriority(a))[0];
  if (quake) {
    items.push({ id: "quake", label: "Earthquake", value: `M${quake.magdefault.toFixed(1)}`, detail: `${quake.location_original} (${quake.n_distancemas})`, priority: quakePriority(quake) });
  }

  if (klci && klci.length >= 2) {
    const change = percentChange(klci.at(-1)!.value, klci.at(-2)!.value);
    const size = Math.abs(change);
    const sign = change > 0 ? "+" : "";
    if (size >= 1) {
      items.push({ id: "klci", label: "FBM KLCI daily move", value: `${sign}${change.toFixed(1)}%`, detail: `Last close ${klci.at(-1)!.value.toFixed(2)}`, priority: size >= 2 ? 3 : 2 });
    }
  }
  return items;
}

// Most urgent first. Sorting is stable, so ties keep the order above.
export function pickGlanceItems(input: GlanceInputs, now = new Date(), count = 4): GlanceItem[] {
  return candidates(input, now).sort((a, b) => b.priority - a.priority).slice(0, count);
}
