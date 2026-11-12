import { useEffect, useState } from "react";
import type { Tone } from "./lib/headlines";
import type { Topic } from "./lib/topics";

export interface AiLabel {
  tone: Tone;
  topics: Topic[];
}

// Labels already fetched, kept for the whole visit. Each label is also cached by the browser and Vercel's CDN.
const labels = new Map<string, AiLabel>();
let unavailable = false;
const workers = 4;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Asks /api/label for each headline without a label, a few at a time, and re-renders as labels arrive.
// Stops for the visit if the server has no AI key, and backs off when Groq's rate limit is hit.
export function useAiLabels(headlines: { title: string }[] | undefined): Map<string, AiLabel> {
  const [, setLabelCount] = useState(0);

  useEffect(() => {
    if (!headlines || unavailable) return;
    let active = true;
    const pending = headlines.map((headline) => headline.title).filter((title) => !labels.has(title));

    async function work() {
      while (active && !unavailable && pending.length) {
        const title = pending.shift()!;
        const response = await fetch(`/api/label?title=${encodeURIComponent(title)}`).catch(() => undefined);
        if (response?.ok) {
          labels.set(title, await response.json());
          if (active) setLabelCount(labels.size);
        } else if (response?.status === 503) {
          unavailable = true;
        } else if (response?.status === 429) {
          pending.push(title);
          await sleep(20_000);
        }
      }
    }

    for (let index = 0; index < workers; index++) work();
    return () => {
      active = false;
    };
  }, [headlines]);

  return labels;
}
