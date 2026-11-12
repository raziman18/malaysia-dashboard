import { afterEach, describe, expect, it, vi } from "vitest";
import { internalKey } from "./_groq";
import { summarise } from "./summary";

const url = (facts: string, headers: HeadersInit = { "x-internal-key": internalKey("key") }) =>
  new Request(`https://site.app/api/summary?facts=${encodeURIComponent(facts)}`, { headers });
const groqReply = (content: string, status = 200) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status }));

afterEach(() => vi.restoreAllMocks());

describe("summarise", () => {
  it("returns the summary and lets the CDN keep it", async () => {
    const fetchSpy = groqReply('{"summary":" Inflation held at 1.2%. "}');
    const response = await summarise(url("Panel: Economy\nInflation: 1.2%"), "key");
    expect(await response.json()).toEqual({ summary: "Inflation held at 1.2%." });
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=2592000");
    const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    expect(body.messages[1].content).toBe("Panel: Economy\nInflation: 1.2%");
  });

  it("refuses callers other than /api/brief, without calling Groq", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect((await summarise(url("Floods", {}), "key")).status).toBe(403);
    expect((await summarise(url("Floods", { "x-internal-key": internalKey("other") }), "key")).status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("refuses without a key or with bad facts, without calling Groq", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect((await summarise(url("Panel: News"), undefined)).status).toBe(503);
    expect((await summarise(url(" "), "key")).status).toBe(400);
    expect((await summarise(url("x".repeat(8001)), "key")).status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("passes rate limits through and never caches failures", async () => {
    groqReply("", 429);
    const limited = await summarise(url("Panel: News"), "key");
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Cache-Control")).toBe("no-store");

    groqReply('{"summary":""}');
    expect((await summarise(url("Panel: News"), "key")).status).toBe(502);
  });
});
