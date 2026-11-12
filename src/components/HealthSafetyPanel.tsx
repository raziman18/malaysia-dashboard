import { fetchBloodDonations } from "../api";
import { timeLabel } from "../lib/format";
import type { Headline } from "../lib/headlines";
import { filterByTopic } from "../lib/topics";
import { malaysiaTime, type Earthquake } from "../lib/warnings";
import { useFetch, type FetchState } from "../useFetch";
import { Sparkline } from "./Sparkline";
import { AiSummary, Async, HeadlineList, Panel } from "./ui";

export function HealthSafetyPanel({ earthquakes, news, summary }: { earthquakes: FetchState<Earthquake[]>; news: FetchState<Headline[]>; summary?: string }) {
  const blood = useFetch(fetchBloodDonations);

  return (
    <Panel title="Public health and safety" sources="National Blood Centre and MET Malaysia via data.gov.my, Free Malaysia Today, Malay Mail, New Straits Times">
      <AiSummary summary={summary} />
      <Async state={blood}>{(points) => <Sparkline title="Blood donations per day, last 30 days" points={points} format={(value) => value.toLocaleString("en-MY")} />}</Async>
      <h3>Health news</h3>
      <Async state={news}>{(headlines) => <HeadlineList headlines={filterByTopic(headlines, "health")} limit={4} />}</Async>
      <h3>Safety and incidents</h3>
      <Async state={news}>{(headlines) => <HeadlineList headlines={filterByTopic(headlines, "safety")} limit={4} />}</Async>
      <h3>Recent earthquakes in the region</h3>
      <Async state={earthquakes}>
        {(list) => (
          <ul className="rows">
            {list.map((quake) => (
              <li key={quake.localdatetime}>
                <span>
                  {quake.location_original}
                  <span className="muted"> ({quake.n_distancemas}), {timeLabel(malaysiaTime(quake.localdatetime))}</span>
                </span>
                <strong>M{quake.magdefault.toFixed(1)}</strong>
              </li>
            ))}
          </ul>
        )}
      </Async>
    </Panel>
  );
}
