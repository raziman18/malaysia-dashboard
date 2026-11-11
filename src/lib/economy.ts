export interface Point {
  date: string;
  value: number;
}

export const percentChange = (current: number, previous: number) => ((current - previous) / previous) * 100;

// Compares the newest monthly point with the same month one year earlier.
export function yearOnYearChange(series: Point[]): number | undefined {
  const [latest] = series;
  if (!latest) return undefined;
  const lastYear = `${Number(latest.date.slice(0, 4)) - 1}${latest.date.slice(4)}`;
  const previous = series.find((point) => point.date === lastYear);
  return previous && percentChange(latest.value, previous.value);
}
