import { fetchHistory } from "../api";
import { dayLabel } from "../lib/format";
import type { DayMetrics } from "../lib/trends";
import { useFetch } from "../useFetch";
import { Sparkline } from "./Sparkline";
import { Async, Panel } from "./ui";

const charts: [key: Exclude<keyof DayMetrics, "date">, title: string, format: (value: number) => string][] = [
  ["negativeShare", "Negative headlines, share of stories", (value) => `${value.toFixed(1)}%`],
  ["warnings", "Active weather warnings", String],
  ["floodStories", "Flood stories", String],
  ["worstAqi", "Worst air quality, US AQI", String],
];

export function TrendsPanel() {
  const history = useFetch(fetchHistory);

  return (
    <Panel title="Trends" sources="This dashboard's own figures, saved once a day" feeds={[history]}>
      <Async state={history}>
        {(days) =>
          days.length < 2 ? (
            <p className="muted">
              Trends build up from one snapshot a day.{" "}
              {days.length ? `The first was saved on ${dayLabel(days[0].date)}, so charts appear tomorrow.` : "The first will be saved this evening."}
            </p>
          ) : (
            charts.map(([key, title, format]) => (
              <Sparkline key={key} title={title} format={format} showChange={false} points={days.flatMap((day) => (day[key] === undefined ? [] : [{ date: day.date, value: day[key]! }]))} />
            ))
          )
        }
      </Async>
    </Panel>
  );
}
