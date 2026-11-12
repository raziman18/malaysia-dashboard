import { afterEach, describe, expect, it, vi } from "vitest";
import { labelHeadline } from "./label";

const url = (title: string) => `https://site.app/api/label?title=${encodeURIComponent(title)}`;
const groqReply = (content: string, status = 200) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status }));

afterEach(() => vi.restoreAllMocks());

describe("labelHeadline", () => {
  it("returns the label and lets the CDN keep it", async () => {
    const fetchSpy = groqReply('{"tone":"negative","topics":["flood","sport"]}');
    const response = await labelHeadline(url("More than 1,300 displaced as floods worsen"), "key");
    expect(await response.json()).toEqual({ tone: "negative", topics: ["flood"] });
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=2592000");
    const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    expect(body.messages[1].content).toBe("More than 1,300 displaced as floods worsen");
  });

  it("refuses without a key or with a bad title, without calling Groq", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect((await labelHeadline(url("Floods"), undefined)).status).toBe(503);
    expect((await labelHeadline(url(""), "key")).status).toBe(400);
    expect((await labelHeadline(url("x".repeat(301)), "key")).status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("passes rate limits through and never caches failures", async () => {
    groqReply("", 429);
    const limited = await labelHeadline(url("Floods"), "key");
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Cache-Control")).toBe("no-store");

    groqReply('{"tone":"angry","topics":[]}');
    expect((await labelHeadline(url("Floods"), "key")).status).toBe(502);
    groqReply("not json");
    expect((await labelHeadline(url("Floods"), "key")).status).toBe(502);
  });
});
