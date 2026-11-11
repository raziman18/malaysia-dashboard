import { describe, expect, it } from "vitest";
import { headlineTone, parseRss, toneSummary } from "./headlines";

describe("parseRss", () => {
  it("reads items and strips the source suffix from titles", () => {
    const xml = `<rss><channel><item>
      <title>Flash floods hit Selangor - The Star</title>
      <link>https://example.com/a</link>
      <pubDate>Wed, 11 Nov 2026 02:00:00 GMT</pubDate>
      <source url="https://thestar.com.my">The Star</source>
    </item></channel></rss>`;
    expect(parseRss(xml)).toEqual([
      { title: "Flash floods hit Selangor", source: "The Star", link: "https://example.com/a", published: new Date("2026-11-11T02:00:00Z") },
    ]);
  });
});

describe("headlineTone", () => {
  it("scores headlines by keyword", () => {
    expect(headlineTone("Flash floods hit Selangor")).toBe("negative");
    expect(headlineTone("Exports surge as investment grows")).toBe("positive");
    expect(headlineTone("Parliament sits today")).toBe("neutral");
  });

  it("does not match keywords inside unrelated words", () => {
    expect(headlineTone("Diesel price unchanged")).toBe("neutral");
  });

  it("summarises a set of headlines", () => {
    expect(toneSummary(["Floods kill two", "Ringgit gains", "Cabinet meets"])).toEqual({ positive: 1, negative: 1, neutral: 1, total: 3 });
  });
});
