import { useEffect, useState } from "react";

let unavailable = false;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Asks /api/summary to summarise the facts and keeps the last summary while a new one loads.
// Stops for the visit if the server has no AI key, and retries when Groq's rate limit is hit.
export function useAiSummary(facts: string | undefined): string | undefined {
  const [summary, setSummary] = useState<string>();

  useEffect(() => {
    if (!facts || unavailable) return;
    let active = true;

    async function load() {
      while (active) {
        const response = await fetch(`/api/summary?facts=${encodeURIComponent(facts!)}`).catch(() => undefined);
        if (response?.status === 503) unavailable = true;
        if (response?.ok && active) setSummary((await response.json()).summary);
        if (response?.status !== 429) return;
        await sleep(20_000);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [facts]);

  return summary;
}
