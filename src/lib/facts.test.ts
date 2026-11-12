import { describe, expect, it } from "vitest";
import { economyFacts, hazardFacts, newsFacts } from "./facts";
import type { Headline } from "./headlines";

const headline = (title: string): Headline => ({ title, description: "", source: "", link: title, published: new Date() });

describe("panel facts", () => {
  it("leaves out feeds that failed and keeps the rest", () => {
    const facts = economyFacts({ unemployment: { date: "2026-09-01", u_rate: 3 }, klci: [{ date: "2026-10-12", value: 1618 }, { date: "2026-11-10", value: 1604.07 }] });
    expect(facts).toBe(["Panel: Economy", "Unemployment rate September 2026: 3%", "FBM KLCI: latest close 1604.07 on 2026-11-10, -0.9% since 2026-10-12; this month's low 1604.07, high 1618.00"].join("\n"));
  });

  it("says when there are no warnings or flood stories, and names the worst air", () => {
    const facts = hazardFacts({ warnings: [], air: [{ city: "Kuching", aqi: 120 }, { city: "Ipoh", aqi: 40 }], floodNews: [] });
    expect(facts).toContain("Active weather warnings: none");
    expect(facts).toContain("Kuching 120 (Unhealthy for sensitive groups), Ipoh 40 (Good)");
    expect(facts).toContain("Flood news, last 24 hours: none");
  });

  it("lists at most 15 headlines", () => {
    const facts = newsFacts(Array.from({ length: 20 }, (_, index) => headline(`Story ${index}`)));
    expect(facts.split("\n")).toHaveLength(17);
  });
});
