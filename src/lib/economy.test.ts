import { describe, expect, it } from "vitest";
import { joinGdpSeries, percentChange, stateGdpShares, yearOnYearChange } from "./economy";

describe("yearOnYearChange", () => {
  it("compares the newest month with the same month last year", () => {
    const series = [
      { date: "2026-09-01", value: 137.6 },
      { date: "2026-08-01", value: 137.5 },
      { date: "2025-09-01", value: 135.0 },
    ];
    expect(yearOnYearChange(series)).toBeCloseTo(1.926, 2);
  });

  it("returns undefined when last year's month is missing", () => {
    expect(yearOnYearChange([{ date: "2026-09-01", value: 137.6 }])).toBeUndefined();
    expect(yearOnYearChange([])).toBeUndefined();
  });
});

it("percentChange handles a fall", () => {
  expect(percentChange(90, 100)).toBe(-10);
});

it("joins GDP growth with the GDP level per quarter, oldest first", () => {
  const rows = [
    { date: "2026-04-01", value: 445896.454, series: "abs" },
    { date: "2026-04-01", value: 1.9, series: "growth_qoq" },
    { date: "2026-04-01", value: 6.0, series: "growth_yoy" },
    { date: "2026-01-01", value: 5.4, series: "growth_yoy" },
    { date: "2026-01-01", value: 437670.264, series: "abs" },
    { date: "2025-10-01", value: 5.0, series: "growth_yoy" },
  ];
  expect(joinGdpSeries(rows)).toEqual([
    { date: "2026-01-01", growth: 5.4, ringgitMillions: 437670.264 },
    { date: "2026-04-01", growth: 6.0, ringgitMillions: 445896.454 },
  ]);
});

it("ranks states by GDP share for the latest year, with growth from the year before", () => {
  const rows = [
    { date: "2025-01-01", state: "Perlis", value: 10 },
    { date: "2025-01-01", state: "Selangor", value: 60 },
    { date: "2025-01-01", state: "Supra", value: 30 },
    { date: "2024-01-01", state: "Selangor", value: 50 },
    { date: "2024-01-01", state: "Supra", value: 40 },
  ];
  expect(stateGdpShares(rows)).toEqual({
    year: "2025",
    states: [
      { state: "Selangor", ringgitMillions: 60, share: 60, growth: 20 },
      { state: "Supra", ringgitMillions: 30, share: 30, growth: -25 },
      { state: "Perlis", ringgitMillions: 10, share: 10, growth: undefined },
    ],
  });
});
