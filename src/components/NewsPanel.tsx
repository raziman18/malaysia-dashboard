import { useCallback, useState } from "react";
import { fetchHeadlines } from "../api";
import { toneSummary, type Headline } from "../lib/headlines";
import { useFetch, type FetchState } from "../useFetch";
import { Async, HeadlineList, Panel } from "./ui";

const topics = [
  { label: "Top stories", query: null },
  { label: "Economy", query: "Malaysia economy OR ringgit OR Bursa" },
  { label: "Politics", query: "Malaysia parliament OR cabinet OR \"Prime Minister\"" },
  { label: "Sabah and Sarawak", query: "Sabah OR Sarawak" },
];

export function NewsPanel({ topNews }: { topNews: FetchState<Headline[]> }) {
  const [topic, setTopic] = useState(topics[0]);
  const loadTopic = useCallback(() => fetchHeadlines(topic.query!), [topic]);
  const topicNews = useFetch(topic.query ? loadTopic : null);
  const news = topic.query ? topicNews : topNews;

  return (
    <Panel title="News and sentiment" sources="Google News (last 24 hours). Tone is a rough keyword score, not a survey.">
      <div className="tabs" role="tablist">
        {topics.map((item) => (
          <button key={item.label} role="tab" aria-selected={item === topic} onClick={() => setTopic(item)}>
            {item.label}
          </button>
        ))}
      </div>
      <Async state={news}>
        {(headlines) => {
          const tone = toneSummary(headlines.map((headline) => headline.title));
          return (
            <>
              <ToneBar {...tone} />
              <HeadlineList headlines={headlines} limit={10} />
            </>
          );
        }}
      </Async>
    </Panel>
  );
}

function ToneBar({ positive, neutral, negative, total }: ReturnType<typeof toneSummary>) {
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
        {parts.map((part) => `${part.count} ${part.key}`).join(", ")} of {total} headlines
      </figcaption>
    </figure>
  );
}
