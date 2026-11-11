import type { ReactNode } from "react";
import { headlineTone, type Headline } from "../lib/headlines";
import { timeLabel } from "../lib/format";
import type { Status } from "../lib/status";
import type { FetchState } from "../useFetch";

export function Panel({ title, sources, children }: { title: string; sources: string; children: ReactNode }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {children}
      <p className="source">Sources: {sources}</p>
    </section>
  );
}

export function StatTile({ label, value, detail }: { label: string; value: ReactNode; detail?: ReactNode }) {
  return (
    <div className="tile">
      <span className="tile-label">{label}</span>
      <strong className="tile-value">{value}</strong>
      {detail && <span className="tile-detail">{detail}</span>}
    </div>
  );
}

const statusIcons: Record<Status, string> = { good: "●", warning: "▲", serious: "◆", critical: "■" };

export function StatusBadge({ status, label }: { status: Status; label: string }) {
  return (
    <span className={`badge badge-${status}`}>
      <span aria-hidden="true">{statusIcons[status]}</span> {label}
    </span>
  );
}

export function Async<T>({ state, children }: { state: FetchState<T>; children: (data: T) => ReactNode }) {
  if (state.data !== undefined) return <>{children(state.data)}</>;
  if (state.error) return <p className="muted">Could not load this feed ({state.error}).</p>;
  return <p className="muted">Loading...</p>;
}

export function HeadlineList({ headlines, limit = 6 }: { headlines: Headline[]; limit?: number }) {
  if (!headlines.length) return <p className="muted">No headlines in the last 24 hours.</p>;
  return (
    <ul className="headlines">
      {headlines.slice(0, limit).map((headline) => (
        <li key={headline.link}>
          {headline.image && <img src={headline.image} alt="" loading="lazy" referrerPolicy="no-referrer" />}
          <div>
            <span className={`tone tone-${headlineTone(headline.title)}`}>{headlineTone(headline.title)}</span>
            <a href={headline.link} target="_blank" rel="noreferrer">{headline.title}</a>
            <span className="muted">{headline.source}, {timeLabel(headline.published)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
