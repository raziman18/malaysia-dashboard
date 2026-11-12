import { mapSize, stateShapes } from "../lib/state-shapes";
import { rank, stateIssues, type StateInputs } from "../lib/states";
import type { Status } from "../lib/status";
import { StatusBadge } from "./ui";

const statusLabels: Record<Status, string> = { good: "Clear", warning: "Watch", serious: "Serious", critical: "Critical" };
const shownReasons = 3;

// Each state coloured by its worst current issue. The list below names every issue, so colour is never the only cue.
export function StateMap(props: StateInputs) {
  const issues = stateIssues(props);
  const listed = [...issues].sort(([, a], [, b]) => rank[b.status] - rank[a.status]);

  return (
    <figure className="state-map">
      <svg viewBox={`0 0 ${mapSize.width} ${mapSize.height}`} role="img" aria-label={`Map of Malaysian states. ${issues.size} states have current issues, listed below.`}>
        {stateShapes.map(({ state, d }) => {
          const issue = issues.get(state);
          return (
            <path key={state} d={d} className={issue && `status-${issue.status}`}>
              <title>{`${state}: ${issue ? issue.reasons.join("; ") : "nothing reported"}`}</title>
            </path>
          );
        })}
      </svg>
      <figcaption className="muted">
        <span className="legend">
          {(["critical", "serious", "warning"] as const).map((status) => (
            <StatusBadge key={status} status={status} label={statusLabels[status]} />
          ))}
          <span>Grey: nothing reported</span>
        </span>
        Sabah, Sarawak and Labuan are drawn closer to the peninsula to fit the screen.
      </figcaption>
      {listed.length ? (
        <ul className="rows state-issues">
          {listed.map(([state, issue]) => (
            <li key={state}>
              <span>
                <strong>{state.replace("W.P. ", "")}</strong>
                <span className="muted">
                  {issue.reasons.slice(0, shownReasons).join("; ")}
                  {issue.reasons.length > shownReasons && `; and ${issue.reasons.length - shownReasons} more`}
                </span>
              </span>
              <StatusBadge status={issue.status} label={statusLabels[issue.status]} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No state has a current warning, flood report or poor air.</p>
      )}
    </figure>
  );
}
