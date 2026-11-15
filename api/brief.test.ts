import { afterEach, describe, expect, it, vi } from "vitest";
import { internalKey } from "./_groq";
import { buildBrief } from "./brief";

const rss = `<rss><channel><item><title>Floods worsen in Perak</title><link>https://example.com/a</link><pubDate>${new Date().toUTCString()}</pubDate></item></channel></rss>`;

afterEach(() => vi.restoreAllMocks());

describe("buildBrief", () => {
  it("labels headlines and summarises each panel through the internal routes, even when other feeds fail", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/api/fmt/category/nation/feed")) return new Response(rss);
      if (url.includes("/api/label")) return Response.json({ tone: "negative", topics: ["flood"] });
      if (url.includes("/api/summary")) return Response.json({ summary: `Summary of ${new URL(url).searchParams.get("facts")!.split("\n")[0]}` });
      return new Response("", { status: 500 });
    });

    const response = await buildBrief(new Request("https://site.app/api/brief"), "key");
    const brief = await response.json();
    expect(brief.labels).toEqual({ "Floods worsen in Perak": { tone: "negative", topics: ["flood"] } });
    expect(brief.summaries).toMatchObject({ hazards: "Summary of Panel: Disasters and weather", news: "Summary of Panel: News", daily: "Summary of Panel: Disasters and weather" });
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=1800");

    const labelCall = fetchSpy.mock.calls.find(([input]) => String(input).includes("/api/label"))!;
    expect(new Headers(labelCall[1]!.headers).get("x-internal-key")).toBe(internalKey("key"));
  });

  it("summarises each bill from its explanatory statement, and keeps the brief briefly while one is missing", async () => {
    const parliament = {
      sittings: [],
      updated: "2026-11-15",
      bills: [
        { code: "D.R.21/2026", title: "Statistics Bill 2026", status: "First Reading", explanation: "The Bill seeks to provide for the functions of DOSM." },
        { code: "D.R.20/2026", title: "Freedom of Information Bill 2026", status: "First Reading", explanation: "The Bill seeks to give access to information." },
        { code: "D.R.19/2026", title: "Bill without a statement", status: "First Reading" },
      ],
    };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = new URL(String(input));
      if (url.pathname === "/parliament.json") return Response.json(parliament);
      if (url.searchParams.get("kind") === "bill") {
        const title = url.searchParams.get("facts")!.split("\n")[0];
        return title.startsWith("Freedom") ? new Response("", { status: 429 }) : Response.json({ summary: `About ${title}` });
      }
      if (url.pathname === "/api/summary") return Response.json({ summary: "Panel summary" });
      return new Response("", { status: 500 });
    });

    const response = await buildBrief(new Request("https://site.app/api/brief"), "key");
    expect((await response.json()).bills).toEqual({ "D.R.21/2026": "About Statistics Bill 2026" });
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=120");
    const billCall = fetchSpy.mock.calls.map(([input]) => new URL(String(input))).find((url) => url.searchParams.get("kind") === "bill")!;
    expect(billCall.searchParams.get("facts")).toContain("The Bill seeks to");
  });

  it("refuses without a key", async () => {
    expect((await buildBrief(new Request("https://site.app/api/brief"), undefined)).status).toBe(503);
  });
});
