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
      { title: "Flash floods hit Selangor", description: "", source: "The Star", link: "https://example.com/a", published: new Date("2026-11-11T02:00:00Z"), image: undefined },
    ]);
  });

  it("reads the image and plain-text description, and falls back to the outlet name", () => {
    const xml = `<rss xmlns:media="http://search.yahoo.com/mrss/"><channel><item>
      <title><![CDATA[Cooking oil prices held]]></title>
      <link>https://example.com/b</link>
      <pubDate>Wed, 11 Nov 2026 17:34:57 +0800</pubDate>
      <description><![CDATA[KUALA LUMPUR, Nov 11 &mdash; The <b>government</b> said...]]></description>
      <media:thumbnail url="https://example.com/b.jpg" />
    </item></channel></rss>`;
    expect(parseRss(xml, "Malay Mail")[0]).toMatchObject({
      source: "Malay Mail",
      description: "KUALA LUMPUR, Nov 11 \u2014 The government said...",
      image: "https://example.com/b.jpg",
    });
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
