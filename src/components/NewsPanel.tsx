import { useState } from "react";
import { toneSummary, type Headline } from "../lib/headlines";
import { filterByTopic, type Topic } from "../lib/topics";
import type { FetchState } from "../useFetch";
import { AiSummary, Async, HeadlineList, Panel } from "./ui";

const tabs: { label: string; topic: Topic | null }[] = [
  { label: "All stories", topic: null },
  { label: "Economy", topic: "economy" },
  { label: "Politics", topic: "politics" },
  { label: "Sabah and Sarawak", topic: "borneo" },
];

export function NewsPanel({ news, summary }: { news: FetchState<Headline[]>; summary?: string }) {
  const [tab, setTab] = useState(tabs[0]);

  return (
    <Panel title="News and sentiment" sources="Free Malaysia Today, Malay Mail, New Straits Times (last 24 hours). Tone labels come from an AI model on Groq; a ? marks a keyword guess." feeds={[news]}>
      <AiSummary summary={summary} />
      <div className="tabs" role="tablist">
        {tabs.map((item) => (
          <button key={item.label} role="tab" aria-selected={item === tab} onClick={() => setTab(item)}>
            {item.label}
          </button>
        ))}
      </div>
      <Async state={news}>
        {(stories) => {
          const headlines = tab.topic ? filterByTopic(stories, tab.topic) : stories;
          return (
            <>
              <ToneBar {...toneSummary(headlines)} />
              <HeadlineList headlines={headlines} limit={10} />
            </>
          );
        }}
      </Async>
    </Panel>
  );
}
function ToneBar({ positive, neutral, negative, total, aiLabelled }: ReturnType<typeof toneSummary>) {
  if (!total) return null;
  const parts = [
    { key: "positive", count: positive },
    { key: "neutral", count: neutral },
    { key: "negative", count: negative },
  ];
  return (
    <figure className="tone-bar">
      <div className="tone-track" role="img" aria-label={`${positive} positive, ${neutral} neutral, ${negative} negative of ${total} headlines`}>
        {parts.map((part) => part.count > 0 && (
          <span key={part.key} className={`tone-${part.key}`} style={{ flexGrow: part.count }} title={`${part.count} ${part.key}`} />
        ))}
      </div>
      <figcaption className="muted">
        {parts.map((part) => `${part.count} ${part.key}`).join(", ")} of {total} headlines. AI labelled {aiLabelled}, the rest are keyword guesses.
      </figcaption>
    </figure>
  );
}
