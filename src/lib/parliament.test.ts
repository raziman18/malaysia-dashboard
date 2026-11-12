import { expect, it } from "vitest";
import { malaysiaToday, sittingOutlook, sittingSummary } from "./parliament";

const sittings = [
  { date: "2026-11-09", business: "No Session", note: "Cuti umum Hari Deepavali" },
  { date: "2026-11-11", business: "Debate on 2027 Budget at the Comittee-level" },
  { date: "2026-11-12", business: "Debate on 2027 Budget at the Comittee-level" },
  { date: "2026-11-16", business: "Debate on 2027 Budget at the Comittee-level" },
];
const parliament = { meeting: { name: "Third Meeting", start: "2026-10-05", end: "2026-12-08" }, sittings, bills: [] };

it("finds today's sitting and the next days that sit", () => {
  expect(sittingOutlook(sittings, "2026-11-08")).toEqual({ today: undefined, upcoming: sittings.slice(1) });
  expect(sittingOutlook(sittings, "2026-11-12", 1).upcoming).toEqual([sittings[3]]);
});

it("says whether the Dewan Rakyat sits today", () => {
  expect(sittingSummary(parliament, "2026-11-12")).toBe("The Dewan Rakyat sits today: Debate on 2027 Budget at the Comittee-level.");
  expect(sittingSummary(parliament, "2026-11-09")).toBe("The Dewan Rakyat does not sit today (Cuti umum Hari Deepavali).");
  expect(sittingSummary(parliament, "2026-11-14")).toBe("The Dewan Rakyat does not sit today.");
  expect(sittingSummary(parliament, "2026-10-01")).toBe("The Dewan Rakyat's Third Meeting starts on 2026-10-05.");
  expect(sittingSummary({ sittings: [], bills: [] }, "2026-12-20")).toBe("No more Dewan Rakyat sittings are scheduled this year.");
});

it("uses the Malaysian date late in the UTC day", () => {
  expect(malaysiaToday(new Date("2026-11-12T17:00:00Z"))).toBe("2026-11-13");
});
