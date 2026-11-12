import type { fetchAirQuality } from "../api";
import { hazardFacts } from "../lib/facts";
import { dayLabel, timeLabel } from "../lib/format";
import { airQualityBand } from "../lib/status";
import type { Headline } from "../lib/headlines";
import { isFeedFresh, latestStationUpdate, malaysiaTime, stationsAboveNormal, type FloodStation, type WeatherWarning } from "../lib/warnings";
import { isSettled, useFetch, type FetchState } from "../useFetch";
import { AiSummary, Async, HeadlineList, Panel, StatusBadge } from "./ui";

type AirReadings = Awaited<ReturnType<typeof fetchAirQuality>>;

interface Props {
  warnings: FetchState<WeatherWarning[]>;
  air: FetchState<AirReadings>;
  stations: FetchState<FloodStation[]>;
  floodNews: FetchState<Headline[]>;
}

// A new timestamp every refresh makes the browser fetch the latest radar image.
const loadRadarStamp = async () => Date.now();

export function HazardPanel({ warnings, air, stations, floodNews }: Props) {
  const radarStamp = useFetch(loadRadarStamp);
  const facts = isSettled(warnings, air, stations, floodNews)
    ? hazardFacts({ warnings: warnings.data, air: air.data, stations: stations.data, floodNews: floodNews.data })
    : undefined;
  const radarUrl = `https://www.met.gov.my/data/radar_malaysia.gif?t=${radarStamp.data ?? ""}`;

  return (
    <Panel title="Disasters and weather" sources="MET Malaysia and JPS via data.gov.my, MET Malaysia radar, Open-Meteo air quality, Free Malaysia Today, Malay Mail, New Straits Times">
      <AiSummary facts={facts} />
      <h3>Active weather warnings</h3>
      <Async state={warnings}>
        {(list) =>
          list.length ? (
            <ul className="warnings">
              {list.map((warning) => (
                <li key={warning.warning_issue.issued + warning.heading_en}>
                  <details>
                    <summary>
                      <StatusBadge status="serious" label={warning.warning_issue.title_en} />
                      <span className="muted">Until {timeLabel(malaysiaTime(warning.valid_to!))}</span>
                    </summary>
                    <p>{warning.text_en}</p>
                  </details>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No active warnings.</p>
          )
        }
      </Async>

      <h3>Rain radar</h3>
      {radarStamp.data && (
        <a className="radar" href={radarUrl} target="_blank" rel="noreferrer">
          <img src={radarUrl} alt="MET Malaysia rain radar map of Peninsular Malaysia, Sabah and Sarawak" referrerPolicy="no-referrer" />
          <span className="muted">MET Malaysia composite radar. Tap to open full size.</span>
        </a>
      )}

      <h3>Floods</h3>
      <Async state={stations}>
        {(list) => {
          if (!isFeedFresh(list)) {
            const updated = latestStationUpdate(list);
            return <p className="notice">The JPS river level feed was last updated {updated ? dayLabel(updated) : "at an unknown date"}, so it is not shown. Flood news from the last 24 hours:</p>;
          }
          return (
            <ul className="rows">
              {stationsAboveNormal(list).slice(0, 8).map((station) => (
                <li key={station.station_name}>
                  <span>{station.station_name}, {station.district}, {station.state}</span>
                  <StatusBadge status={station.water_level_indicator === "DANGER" ? "critical" : "serious"} label={station.water_level_indicator} />
                </li>
              ))}
            </ul>
          );
        }}
      </Async>
      <Async state={floodNews}>{(headlines) => <HeadlineList headlines={headlines} limit={4} />}</Async>

      <h3>Air quality by state capital (US AQI)</h3>
      <Async state={air}>
        {(readings) => (
          <ul className="rows air">
            {readings.map(({ city, aqi }) => (
              <li key={city}>
                <span>{city}</span>
                <span className="air-value">
                  <strong>{aqi}</strong> <StatusBadge {...airQualityBand(aqi)} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Async>
    </Panel>
  );
}
