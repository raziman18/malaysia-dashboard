export interface Point {
  date: string;
  value: number;
}

export const percentChange = (current: number, previous: number) => ((current - previous) / previous) * 100;

export interface GdpQuarter {
  date: string;
  growth: number;
  ringgitMillions: number;
}

// DOSM publishes each quarter as separate rows per series. Joins year-on-year growth with the real GDP level, oldest first.
export function joinGdpSeries(rows: { date: string; value: number; series: string }[]): GdpQuarter[] {
  const levels = new Map(rows.filter((row) => row.series === "abs").map((row) => [row.date, row.value]));
  return rows
    .filter((row) => row.series === "growth_yoy" && levels.has(row.date))
    .map((row) => ({ date: row.date, growth: row.value, ringgitMillions: levels.get(row.date)! }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Compares the newest monthly point with the same month one year earlier.
export function yearOnYearChange(series: Point[]): number | undefined {
  const [latest] = series;
  if (!latest) return undefined;
  const lastYear = `${Number(latest.date.slice(0, 4)) - 1}${latest.date.slice(4)}`;
  const previous = series.find((point) => point.date === lastYear);
  return previous && percentChange(latest.value, previous.value);
}

export interface StateGdp {
  state: string;
  ringgitMillions: number;
  share: number;
  growth?: number;
}

// Share of national GDP for the latest year, largest first. DOSM has no national row, so the total is the sum of
// all rows, including "Supra" (output not assigned to any state, mainly offshore oil and gas).
// Growth is computed from the previous year's level because DOSM publishes it for the 13 states only, not the
// federal territories or Supra. The computed values match DOSM's published state figures.
export function stateGdpShares(rows: { date: string; state: string; value: number }[]): { year: string; states: StateGdp[] } {
  const year = rows.map((row) => row.date).sort().at(-1) ?? "";
  const previousYear = `${Number(year.slice(0, 4)) - 1}${year.slice(4)}`;
  const previous = new Map(rows.filter((row) => row.date === previousYear).map((row) => [row.state, row.value]));
  const latest = rows.filter((row) => row.date === year);
  const total = latest.reduce((sum, row) => sum + row.value, 0);
  const states = latest
    .map((row) => {
      const before = previous.get(row.state);
      return { state: row.state, ringgitMillions: row.value, share: (row.value / total) * 100, growth: before && percentChange(row.value, before) };
    })
    .sort((a, b) => b.ringgitMillions - a.ringgitMillions);
  return { year: year.slice(0, 4), states };
}
