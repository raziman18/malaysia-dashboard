import type { SourceHealth } from "../lib/health";
import { Panel, StatusBadge } from "./ui";

// Every source with its state, so a broken or stale feed is visible on the dashboard itself.
export function SourcesPanel({ sources }: { sources: SourceHealth[] }) {
  const working = sources.filter((source) => source.status === "good").length;

  return (
    <Panel title="Source health" sources="This dashboard's own checks, run in your browser" feeds={[]}>
      <p id="sources">
        {working} of {sources.length} sources working.
      </p>
      <ul className="rows">
        {sources.map((source) => (
          <li key={source.name}>
            <span>
              {source.name}
              {source.detail && <span className="muted source-detail">{source.detail}</span>}
            </span>
            {source.status ? <StatusBadge status={source.status} label={source.label} /> : <span className="muted">{source.label}</span>}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
