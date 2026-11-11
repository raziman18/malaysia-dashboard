import { expect, it } from "vitest";
import { quarterLabel } from "./format";

it("labels DOSM quarter start dates", () => {
  expect(quarterLabel("2026-01-01")).toBe("Q1 2026");
  expect(quarterLabel("2026-04-01")).toBe("Q2 2026");
  expect(quarterLabel("2025-10-01")).toBe("Q4 2025");
});
