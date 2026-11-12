const timeZone = "Asia/Kuala_Lumpur";

export const ringgit = (value: number, digits = 2) => `RM ${value.toFixed(digits)}`;
export const signedPercent = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
// "+3.9% from 4 Nov", "unchanged since 4 Nov", or nothing without an earlier price.
export function priceChangeLabel({ price, previous, previousDate }: { price: number; previous?: number; previousDate?: string }) {
  if (previous === undefined || !previousDate) return "";
  const since = new Date(previousDate).toLocaleDateString("en-MY", { day: "numeric", month: "short", timeZone });
  const change = ((price - previous) / previous) * 100;
  if (Math.abs(change) < 0.05) return `unchanged since ${since}`;
  return `${signedPercent(change)} from ${since}`;
}

// A week-on-week price change, such as "-RM 0.40" or "unchanged".
export function ringgitChange(value: number) {
  if (Math.abs(value) < 0.005) return "unchanged";
  return `${value > 0 ? "+" : "-"}RM ${Math.abs(value).toFixed(2)}`;
}
export const ringgitBillions = (millions: number) => `RM ${(millions / 1000).toFixed(1)}b`;
export const monthLabel = (isoDate: string) => new Date(isoDate).toLocaleDateString("en-MY", { month: "long", year: "numeric", timeZone });
export const dayLabel = (date: Date | string) => new Date(date).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric", timeZone });
export const timeLabel = (date: Date) => date.toLocaleString("en-MY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone });
export const quarterLabel = (isoDate: string) => `Q${Math.floor(Number(isoDate.slice(5, 7)) / 3) + 1} ${isoDate.slice(0, 4)}`;
