import { describe, expect, it } from "vitest";
import { percentChange, yearOnYearChange } from "./economy";

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
