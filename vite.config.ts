/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";
import { dataGovUrl } from "./api/gov";
import { summarise } from "./api/summary";
import { labelTone } from "./api/tone";

// The public APIs block browser requests from other origins (CORS), so the dev server forwards them.
const forward = (target: string, prefix: string, headers?: Record<string, string>): ProxyOptions => ({
  target,
  changeOrigin: true,
  headers,
  rewrite: (path) => path.replace(prefix, ""),
});

const tenMinutes = 10 * 60_000;

// data.gov.my rate limits anonymous callers tightly, so replies are cached, identical requests share
// one upstream call, and a 429 reply is retried after a pause. A token raises the limit.
function dataGovMy(token?: string): Plugin {
  const cache = new Map<string, Promise<{ status: number; body: string; expires: number }>>();
  const headers: Record<string, string> = token ? { Authorization: `Token ${token}` } : {};

  async function load(url: string) {
    for (let attempt = 1; ; attempt++) {
      const response = await fetch(url, { headers });
      if (response.status !== 429 || attempt === 4) {
        return { status: response.status, body: await response.text(), expires: Date.now() + tenMinutes };
      }
      await new Promise((resolve) => setTimeout(resolve, 20_000));
    }
  }

  return {
    name: "data-gov-my",
    configureServer(server) {
      server.middlewares.use("/api/gov", async (request, response) => {
        const [path, query = ""] = request.url!.split("?");
        const url = dataGovUrl(path, query);
        let pending = cache.get(url);
        if (!pending || (await pending).expires < Date.now()) {
          pending = load(url);
          cache.set(url, pending);
        }
        const reply = await pending;
        if (reply.status !== 200) cache.delete(url);
        response.statusCode = reply.status;
        response.setHeader("Content-Type", "application/json");
        response.end(reply.body);
      });
    },
  };
}

// Serves the same /api/tone and /api/summary functions that Vercel runs.
function aiRoutes(apiKey?: string): Plugin {
  const routes = { "/api/tone": labelTone, "/api/summary": summarise };
  return {
    name: "ai-routes",
    configureServer(server) {
      for (const [path, handle] of Object.entries(routes)) {
        server.middlewares.use(path, async (request, response) => {
          const reply = await handle(`http://localhost${request.originalUrl}`, apiKey);
          response.statusCode = reply.status;
          reply.headers.forEach((value, key) => response.setHeader(key, value));
          response.end(await reply.text());
        });
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), dataGovMy(env.DATA_GOV_MY_TOKEN), aiRoutes(env.GROQ_API_KEY)],
    server: {
      proxy: {
        "/api/bnm": forward("https://api.bnm.gov.my/public", "/api/bnm"),
        "/api/fmt": forward("https://cms.freemalaysiatoday.com", "/api/fmt", { "User-Agent": "Mozilla/5.0" }),
        "/api/malaymail": forward("https://www.malaymail.com", "/api/malaymail", { "User-Agent": "Mozilla/5.0" }),
        "/api/nst": forward("https://www.nst.com.my", "/api/nst", { "User-Agent": "Mozilla/5.0" }),
        "/api/air": forward("https://air-quality-api.open-meteo.com/v1", "/api/air"),
        "/api/market": forward("https://query1.finance.yahoo.com/v8/finance", "/api/market", { "User-Agent": "Mozilla/5.0" }),
      },
    },
    test: { environment: "jsdom" },
  };
});
