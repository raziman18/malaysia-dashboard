import { expect, it } from "vitest";
import { priceChangeLabel, quarterLabel, ringgitChange, signedPercent } from "./format";

it("labels DOSM quarter start dates", () => {
  expect(quarterLabel("2026-01-01")).toBe("Q1 2026");
  expect(quarterLabel("2026-04-01")).toBe("Q2 2026");
  expect(quarterLabel("2025-10-01")).toBe("Q4 2025");
});

it("describes weekly price changes, ignoring floating point noise", () => {
  expect(ringgitChange(-0.39999999999999947)).toBe("-RM 0.40");
  expect(ringgitChange(0.05)).toBe("+RM 0.05");
  expect(ringgitChange(0)).toBe("unchanged");
});

it("describes a staple price against its earlier price", () => {
  expect(priceChangeLabel({ price: 7.99, previous: 7.69, previousDate: "2026-11-04" })).toBe("+3.9% from 4 Nov");
  expect(priceChangeLabel({ price: 2.5, previous: 2.5, previousDate: "2026-10-26" })).toBe("unchanged since 26 Oct");
  expect(priceChangeLabel({ price: 32, previous: 31.99, previousDate: "2026-10-26" })).toBe("unchanged since 26 Oct");
  expect(priceChangeLabel({ price: 2.85 })).toBe("");
});

it("signs percentages so growth and contraction read at a glance", () => {
  expect(signedPercent(6.31)).toBe("+6.3%");
  expect(signedPercent(-2.8)).toBe("-2.8%");
  expect(signedPercent(0)).toBe("0.0%");
});
