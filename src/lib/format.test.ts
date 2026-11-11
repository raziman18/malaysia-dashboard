import { expect, it } from "vitest";
import { quarterLabel, signedPercent } from "./format";

it("labels DOSM quarter start dates", () => {
  expect(quarterLabel("2026-01-01")).toBe("Q1 2026");
  expect(quarterLabel("2026-04-01")).toBe("Q2 2026");
  expect(quarterLabel("2025-10-01")).toBe("Q4 2025");
});

it("signs percentages so growth and contraction read at a glance", () => {
  expect(signedPercent(6.31)).toBe("+6.3%");
  expect(signedPercent(-2.8)).toBe("-2.8%");
  expect(signedPercent(0)).toBe("0.0%");
});
