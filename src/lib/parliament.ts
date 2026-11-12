// parlimen.gov.my has no API and does not answer cloud servers, so scripts/parliament.ts reads its pages from a
// computer in Malaysia and saves the result in public/parliament.json. These parsers turn its pages into data.

export const parliamentSite = "https://www.parlimen.gov.my";

export interface Meeting {
  name: string;
  start: string;
  end: string;
  id: string;
}

export interface Sitting {
  date: string;
  business: string;
  note?: string;
}

export interface Bill {
  code: string;
  title: string;
  status: string;
  firstReading?: string;
  secondReading?: string;
  passed?: string;
  presenter?: string;
}

// Saved in public/parliament.json by scripts/parliament.ts.
export interface Parliament {
  meeting?: Omit<Meeting, "id">;
  sittings: Sitting[];
  bills: Bill[];
  // The day the file was last refreshed.
  updated: string;
}

const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const text = (html: string) =>
  html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").replace(/\( /g, "(").trim();

// "5 October 2026" or "Monday, 05 October 2026" to "2026-10-05".
function isoDate(value: string) {
  const match = value.match(/(\d{1,2}) (\w+) (\d{4})/);
  const month = match && months.indexOf(match[2].toLowerCase());
  if (!match || month === null || month < 0) return undefined;
  return `${match[3]}-${String(month + 1).padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

// "06/10/2026" to "2026-10-06". A dash means no date yet.
const slashDate = (value?: string) => value?.match(/(\d{2})\/(\d{2})\/(\d{4})/)?.slice(1).reverse().join("-");

// The year's meetings from the calendar page, such as "Third Meeting, 5 October 2026 - 8 December 2026".
export function parseMeetings(html: string): Meeting[] {
  return [...html.matchAll(/<b>\s*([^<]*Meeting)\s*<\/b>[\s\S]*?[?&]id=(-?\d+)&(?:amp;)?ssid=(\d+)[\s\S]*?<div align="center">([^<]+)<\/div>/g)].flatMap(
    ([, name, id, session, dates]) => {
      const [start, end = start] = dates.split(" - ").map(isoDate);
      return start && end ? [{ name: name.trim(), start, end, id: `id=${id}&ssid=${session}` }] : [];
    },
  );
}

// Each sitting day of one meeting, with its business and any note such as a public holiday.
export function parseSittings(html: string): Sitting[] {
  return [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].flatMap(([, row]) => {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(([, cell]) => text(cell));
    const date = cells.length === 4 && /^\w+day, /.test(cells[0]) ? isoDate(cells[0]) : undefined;
    if (!date) return [];
    const note = cells[3].replace(/^-\s*/, "");
    return [{ date, business: cells[1], ...(note && { note }) }];
  });
}

export function parseBills(html: string): Bill[] {
  return [...html.matchAll(/(D\.R\.\d+\/\d{4})\s*<\/a>[\s\S]*?<td[^>]*class="maintd">\s*\d{4}\s*<\/td>\s*<td class="maintd">([\s\S]*?)<\/td>[\s\S]*?ruustatus\d*"[^>]*>([^<]*)<\/div>([\s\S]*?)Tutup<\/a>/g)].map(
    ([, code, title, status, details]) => {
      const detail = text(details);
      const field = (label: string) => detail.match(new RegExp(`${label} : (.+?)(?= The second reading| Presented by| Passed At|$)`))?.[1];
      return {
        code,
        title: text(title),
        status: status.trim(),
        firstReading: slashDate(field("First reading")),
        secondReading: slashDate(field("The second reading")),
        passed: slashDate(field("Passed At")),
        presenter: field("Presented by")?.replace(/^YB (Senator )?/, ""),
      };
    },
  );
}

export const sits = (sitting: Sitting) => !/no session/i.test(sitting.business);

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

// MPs' order paper for a sitting day, published each morning as OPDR-DDMMYYYY.pdf.
export const orderPaperUrl = (date: string) => `${parliamentSite}/files/opindex/pdf/OPDR-${date.slice(8, 10)}${date.slice(5, 7)}${date.slice(0, 4)}.pdf`;
