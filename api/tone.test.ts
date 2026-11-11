import { afterEach, describe, expect, it, vi } from "vitest";
import { labelTone } from "./tone";

const url = (title: string) => `https://site.app/api/tone?title=${encodeURIComponent(title)}`;
const groqReply = (content: string, status = 200) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status }));

afterEach(() => vi.restoreAllMocks());

describe("labelTone", () => {
  it("returns the label and lets the CDN keep it", async () => {
    const fetchSpy = groqReply('{"tone":"negative"}');
    const response = await labelTone(url("More than 1,300 displaced as floods worsen"), "key");
    expect(await response.json()).toEqual({ tone: "negative" });
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=2592000");
    const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    expect(body.messages[1].content).toBe("More than 1,300 displaced as floods worsen");
  });

  it("refuses without a key or with a bad title, without calling Groq", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect((await labelTone(url("Floods"), undefined)).status).toBe(503);
    expect((await labelTone(url(""), "key")).status).toBe(400);
    expect((await labelTone(url("x".repeat(301)), "key")).status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("passes rate limits through and never caches failures", async () => {
    groqReply("", 429);
    const limited = await labelTone(url("Floods"), "key");
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Cache-Control")).toBe("no-store");

    groqReply('{"tone":"angry"}');
    expect((await labelTone(url("Floods"), "key")).status).toBe(502);
    groqReply("not json");
    expect((await labelTone(url("Floods"), "key")).status).toBe(502);
  });
});
