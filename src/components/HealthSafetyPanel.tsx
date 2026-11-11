import { fetchBloodDonations, fetchHeadlines } from "../api";
import { timeLabel } from "../lib/format";
import { malaysiaTime, type Earthquake } from "../lib/warnings";
import { useFetch, type FetchState } from "../useFetch";
import { Sparkline } from "./Sparkline";
import { Async, HeadlineList, Panel } from "./ui";

const loadHealthNews = () => fetchHeadlines("Malaysia dengue OR hospital OR \"health ministry\" OR KKM");
const loadSafetyNews = () => fetchHeadlines("Malaysia police OR accident OR crime OR fire");

export function HealthSafetyPanel({ earthquakes }: { earthquakes: FetchState<Earthquake[]> }) {
  const blood = useFetch(fetchBloodDonations);
  const healthNews = useFetch(loadHealthNews);
  const safetyNews = useFetch(loadSafetyNews);

  return (
    <Panel title="Public health and safety" sources="National Blood Centre and MET Malaysia via data.gov.my, Google News">
      <Async state={blood}>{(points) => <Sparkline title="Blood donations per day, last 30 days" points={points} format={(value) => value.toLocaleString("en-MY")} />}</Async>
      <h3>Health news</h3>
      <Async state={healthNews}>{(headlines) => <HeadlineList headlines={headlines} limit={4} />}</Async>
      <h3>Safety and incidents</h3>
      <Async state={safetyNews}>{(headlines) => <HeadlineList headlines={headlines} limit={4} />}</Async>
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
