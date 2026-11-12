import type { Parliament, Sitting } from "../../api/parliament.js";

const sits = (sitting: Sitting) => !/no session/i.test(sitting.business);

// Today's entry in the calendar, if any, and the next few days the Dewan Rakyat sits.
export function sittingOutlook(sittings: Sitting[], today: string, count = 4) {
  return {
    today: sittings.find((sitting) => sitting.date === today),
    upcoming: sittings.filter((sitting) => sitting.date > today && sits(sitting)).slice(0, count),
  };
}

// "2026-11-12" for the current day in Malaysia.
export const malaysiaToday = (now = new Date()) => new Date(now.getTime() + 8 * 3_600_000).toISOString().slice(0, 10);

// A sentence on whether the Dewan Rakyat sits today, for the panel and the AI brief.
export function sittingSummary({ meeting, sittings }: Parliament, today: string): string {
  if (!meeting) return "No more Dewan Rakyat sittings are scheduled this year.";
  if (today < meeting.start) return `The Dewan Rakyat's ${meeting.name} starts on ${meeting.start}.`;
  const entry = sittingOutlook(sittings, today).today;
  if (entry && sits(entry)) return `The Dewan Rakyat sits today: ${entry.business}${entry.note ? ` (${entry.note})` : ""}.`;
  return `The Dewan Rakyat does not sit today${entry?.note ? ` (${entry.note})` : ""}.`;
}
