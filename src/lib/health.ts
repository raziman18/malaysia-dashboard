import { dayLabel } from "./format.js";
import type { Status } from "./status.js";

export interface SourceCheck {
  name: string;
  loaded: boolean;
  error?: string;
  // The date of the newest data, for sources that should update regularly.
  updated?: string | Date;
  maxAgeDays?: number;
}

export interface SourceHealth {
  name: string;
  // Missing while the source is still loading.
  status?: Status;
  label: string;
  detail: string;
}

const day = 86_400_000;

export function sourceHealth({ name, loaded, error, updated, maxAgeDays }: SourceCheck, now = new Date()): SourceHealth {
  if (!loaded && error) return { name, status: "critical", label: "Failing", detail: error };
  if (!loaded) return { name, label: "Checking", detail: "" };
  const age = updated === undefined ? 0 : now.getTime() - new Date(updated).getTime();
  const dated = updated === undefined ? "" : `Latest data ${dayLabel(updated)}`;
  if (maxAgeDays !== undefined && age > maxAgeDays * day) return { name, status: "warning", label: "Stale", detail: dated };
  if (error) return { name, status: "warning", label: "Last refresh failed", detail: `${error}. ${dated}`.trim() };
  return { name, status: "good", label: "Working", detail: dated };
}

// The sources that need attention, worst first.
export const needsAttention = (sources: SourceHealth[]) =>
  sources.filter((source) => source.status === "critical" || source.status === "warning").sort((a, b) => (a.status === "critical" ? -1 : 1) - (b.status === "critical" ? -1 : 1));
