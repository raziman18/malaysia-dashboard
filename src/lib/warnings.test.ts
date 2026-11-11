import { describe, expect, it } from "vitest";
import { activeWarnings, isFeedFresh, latestStationUpdate, malaysiaTime, stationsAboveNormal, type FloodStation, type WeatherWarning } from "./warnings";

const warning = (issued: string, validTo: string | null): WeatherWarning => ({
  warning_issue: { issued, title_en: "Thunderstorm Warning" },
  valid_from: "2026-11-11T00:00:00",
  valid_to: validTo,
  heading_en: "",
  text_en: "",
});

describe("activeWarnings", () => {
  it("drops expired and open-ended advisories and puts the newest first", () => {
    const now = new Date("2026-11-11T10:00:00+08:00");
    const result = activeWarnings(
      [warning("2026-11-11T08:00:00", "2026-11-11T12:00:00"), warning("2026-11-10T08:00:00", "2026-11-11T09:59:00"), warning("2026-11-11T09:00:00", "2026-11-12T00:00:00"), warning("2026-11-11T09:30:00", null)],
      now,
    );
    expect(result.map((item) => item.warning_issue.issued)).toEqual(["2026-11-11T09:00:00", "2026-11-11T08:00:00"]);
  });
});

it("reads MET timestamps as Malaysia time", () => {
  expect(malaysiaTime("2026-11-11 08:00:00").toISOString()).toBe("2026-11-11T00:00:00.000Z");
});

it("keeps flood stations above normal, most severe first", () => {
  const station = (water_level_indicator: string) => ({ water_level_indicator }) as FloodStation;
  const result = stationsAboveNormal([station("NORMAL"), station("ALERT"), station("DANGER"), station("WARNING")]);
  expect(result.map((item) => item.water_level_indicator)).toEqual(["DANGER", "WARNING", "ALERT"]);
});

it("finds the newest station update and ignores stations without one", () => {
  const station = (water_level_update_datetime: string) => ({ water_level_update_datetime }) as FloodStation;
  const stations = [station("2024-02-23 14:00:00"), station(null as unknown as string), station("2024-02-23 14:45:00")];
  expect(latestStationUpdate(stations)?.toISOString()).toBe("2024-02-23T06:45:00.000Z");
  expect(latestStationUpdate([])).toBeUndefined();
});

it("treats river readings older than two days as stale", () => {
  const station = (water_level_update_datetime: string) => ({ water_level_update_datetime }) as FloodStation;
  const now = new Date("2026-11-11T12:00:00+08:00");
  expect(isFeedFresh([station("2026-11-11 08:00:00")], now)).toBe(true);
  expect(isFeedFresh([station("2024-02-23 14:45:00")], now)).toBe(false);
  expect(isFeedFresh([], now)).toBe(false);
});
