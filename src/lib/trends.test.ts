import { expect, it } from "vitest";
import type { Headline } from "./headlines";
import { dayMetrics } from "./trends";

const story = (title: string, tone?: Headline["tone"]): Headline => ({ title, tone, description: "", source: "", link: title, published: new Date() });

it("sums up a day, leaving out figures whose feed failed", () => {
  const metrics = dayMetrics({
    news: [story("Floods worsen in Perak", "negative"), story("Ringgit steady", "neutral"), story("Banjir di Kelantan", "negative")],
    air: [{ aqi: 40 }, { aqi: 117 }],
    rates: [{ code: "USD", ringgit: 4.084 }],
  });
  expect(metrics).toEqual({ headlines: 3, negativeShare: 66.7, warnings: undefined, worstAqi: 117, floodStories: 2, klci: undefined, usd: 4.084 });
});
