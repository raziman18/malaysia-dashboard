import { expect, it } from "vitest";
import type { Headline } from "./headlines";
import { stateIssues } from "./states";
import type { WeatherWarning } from "./warnings";

const warning = (title_en: string, text_en: string) => ({ warning_issue: { issued: "", title_en }, text_en }) as WeatherWarning;
const story = (title: string): Headline => ({ title, description: "", source: "", link: title, published: new Date() });

it("gives each state its worst issue and every reason", () => {
  const issues = stateIssues({
    warnings: [
      warning("Continuous Rain Warning", "Continuous rain is expected over Kelantan (Bachok) • Terengganu (Besut)"),
      warning("Strong Winds and Rough Seas Warning", "Strong winds over the waters of Penang • Kelantan • N. Sembilan"),
    ],
    air: [{ city: "Kuala Lumpur", state: "W.P. Kuala Lumpur", aqi: 160 }, { city: "Ipoh", state: "Perak", aqi: 80 }],
    floodNews: [story("Flood evacuees in Selangor, Perak rise to 1,444"), story("PRN Melaka: Calon buat laporan polis")],
  });

  expect(issues.get("Kelantan")).toEqual({ status: "serious", reasons: ["Continuous Rain Warning", "Strong Winds and Rough Seas Warning (coastal waters)"] });
  expect(issues.get("Pulau Pinang")?.status).toBe("warning");
  expect(issues.get("Negeri Sembilan")?.status).toBe("warning");
  expect(issues.get("W.P. Kuala Lumpur")).toEqual({ status: "critical", reasons: ["Air quality 160 in Kuala Lumpur (Unhealthy)"] });
  expect(issues.get("Perak")).toEqual({ status: "serious", reasons: ["Flood news: Flood evacuees in Selangor, Perak rise to 1,444"] });
  expect(issues.has("Johor")).toBe(false);
  expect(issues.has("Melaka")).toBe(false);
});
