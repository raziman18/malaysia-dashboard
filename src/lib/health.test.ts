import { expect, it } from "vitest";
import { needsAttention, sourceHealth } from "./health";

const now = new Date("2026-11-12T12:00:00+08:00");

it("rates a source as working, stale, failing or still checking", () => {
  expect(sourceHealth({ name: "Fuel prices", loaded: true, updated: "2026-11-12", maxAgeDays: 10 }, now)).toEqual({
    name: "Fuel prices",
    status: "good",
    label: "Working",
    detail: "Latest data 12 Nov 2026",
  });
  expect(sourceHealth({ name: "Parliament", loaded: true, updated: "2026-11-05", maxAgeDays: 3 }, now)).toMatchObject({ status: "warning", label: "Stale" });
  expect(sourceHealth({ name: "New Straits Times", loaded: false, error: "Source returned 403" }, now)).toEqual({
    name: "New Straits Times",
    status: "critical",
    label: "Failing",
    detail: "Source returned 403",
  });
  expect(sourceHealth({ name: "KLCI", loaded: true, error: "Source returned 500" }, now)).toMatchObject({ status: "warning", label: "Last refresh failed" });
  expect(sourceHealth({ name: "Air quality", loaded: false }, now)).toEqual({ name: "Air quality", label: "Checking", detail: "" });
});

it("lists failing sources before stale ones and leaves out working ones", () => {
  const sources = [
    { name: "A", status: "warning" as const, label: "Stale", detail: "" },
    { name: "B", status: "good" as const, label: "Working", detail: "" },
    { name: "C", status: "critical" as const, label: "Failing", detail: "" },
  ];
  expect(needsAttention(sources).map((source) => source.name)).toEqual(["C", "A"]);
});
