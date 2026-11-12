import { describe, expect, it } from "vitest";
import { pickGlanceItems, urgentItems, type GlanceInputs } from "./glance";
import type { Headline } from "./headlines";
import type { Earthquake, FloodStation, WeatherWarning } from "./warnings";

const now = new Date("2026-11-11T12:00:00+08:00");
const headline = (title: string): Headline => ({ title, description: "", source: "", link: title, published: now });
const warning = { warning_issue: { issued: "2026-11-11T08:00:00", title_en: "Thunderstorms Warning" } } as WeatherWarning;
const quake = (magdefault: number, n_distancemas: string, localdatetime = "2026-11-11T09:00:00"): Earthquake => ({ magdefault, n_distancemas, localdatetime, location_original: "Sulawesi" });
const station = (water_level_indicator: string, water_level_update_datetime: string) =>
  ({ station_name: "Sg. Kelantan", state: "KELANTAN", water_level_indicator, water_level_update_datetime }) as FloodStation;

const quietDay: GlanceInputs = {
  warnings: [],
  air: [{ city: "Kuching", aqi: 40 }],
  usdRate: 4.07,
  topNews: [headline("Cabinet meets"), headline("Ringgit steady")],
  earthquakes: [quake(4.5, "900km SE Semporna,Sabah")],
  klci: [{ date: "2026-11-10", value: 1600 }, { date: "2026-11-11", value: 1605 }],
};

const ids = (input: GlanceInputs) => pickGlanceItems(input, now).map((item) => item.id);

describe("pickGlanceItems", () => {
  it("shows the four standard boxes on a quiet day", () => {
    expect(ids(quietDay)).toEqual(["weather", "air", "ringgit", "headlines"]);
  });

  it("puts a strong nearby earthquake and unhealthy air ahead of the fillers", () => {
    const input = { ...quietDay, air: [{ city: "Kuala Lumpur", aqi: 160 }], earthquakes: [quake(6.2, "1,282km SE Semporna,Sabah")] };
    expect(ids(input).slice(0, 2)).toEqual(["air", "quake"]);
  });

  it("ignores distant and old earthquakes", () => {
    const input = { ...quietDay, earthquakes: [quake(7.1, "5,488km E Semporna,Sabah"), quake(6.5, "300km SE Semporna,Sabah", "2026-11-09T09:00:00")] };
    expect(ids(input)).not.toContain("quake");
  });

  it("uses fresh river readings and falls back to flood news when the feed is stale", () => {
    const floodNews = [headline("Floods in Kelantan"), headline("Banjir di Pahang"), headline("Evacuations rise")];
    const fresh = pickGlanceItems({ ...quietDay, floodNews, floodStations: [station("DANGER", "2026-11-11 11:00:00")] }, now);
    expect(fresh[0]).toMatchObject({ id: "rivers", priority: 4 });
    expect(ids({ ...quietDay, floodNews, floodStations: [station("DANGER", "2024-02-23 14:45:00")] })[0]).toBe("flood-news");
  });

  it("flags a large KLCI move and a mostly negative news day", () => {
    const input = {
      ...quietDay,
      warnings: [warning],
      klci: [{ date: "2026-11-10", value: 1600 }, { date: "2026-11-11", value: 1560 }],
      topNews: [headline("Floods kill two"), headline("Scam syndicate arrested"), headline("Cabinet meets")],
    };
    const items = pickGlanceItems(input, now);
    expect(items.map((item) => item.id)).toEqual(["klci", "weather", "headlines", "air"]);
    expect(items[0].value).toBe("-2.5%");
  });
});

describe("urgentItems", () => {
  it("is empty on a quiet day and lists only urgent items otherwise", () => {
    expect(urgentItems(quietDay, now)).toEqual([]);
    const input = { ...quietDay, air: [{ city: "Kuala Lumpur", aqi: 160 }], earthquakes: [quake(6.2, "1,282km SE Semporna,Sabah")] };
    expect(urgentItems(input, now).map((item) => item.id)).toEqual(["air", "quake"]);
  });
});
