// Vercel function with the latest prices of staple goods from DOSM's PriceCatcher survey. data.gov.my publishes it
// only as monthly parquet files of 1 to 2 MB, too large to download on every visit, so the server reads them and
// Vercel's CDN keeps the small result for six hours. The survey is updated once a day.
import { parquetReadObjects } from "hyparquet";
import { compressors } from "hyparquet-compressors";
import { json } from "./_groq.js";

// Item codes from data.gov.my's lookup_item table, chosen because many shops report them.
export const staples: [code: number, name: string][] = [
  [1, "Chicken, standard, 1 kg"],
  [1110, "Eggs, grade B, 30"],
  [2066, "Imported white rice (Faiza Emas), 10 kg"],
  [266, "Cooking oil (Seri Murni), 5 kg"],
  [918, "Cooking oil, subsidised packet, 1 kg"],
  [1589, "White sugar, 1 kg"],
  [917, "Wheat flour (Cap Sauh), 1 kg"],
  [88, "Catfish, 1 kg"],
];

export interface StaplePrice {
  name: string;
  price: number;
  date: string;
  previous?: number;
  previousDate?: string;
}

interface Row {
  date: Date;
  item_code: bigint | number;
  price: number;
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const week = 7 * 86_400_000;

// Median price across shops. Packaged goods are surveyed about once a week and fresh goods daily, with few reports
// at weekends and on holidays. So each item uses its latest well-reported day (at least half its busiest day's
// reports) and compares it with its latest well-reported day at least a week before.
export function staplePrices(rows: Row[]): StaplePrice[] {
  const byItem = new Map(staples.map(([code]) => [code, new Map<string, number[]>()]));
  for (const row of rows) {
    const byDay = byItem.get(Number(row.item_code));
    if (!byDay) continue;
    const day = row.date.toISOString().slice(0, 10);
    const prices = byDay.get(day) ?? [];
    prices.push(row.price);
    byDay.set(day, prices);
  }
  return staples.flatMap(([code, name]) => {
    const byDay = byItem.get(code)!;
    const busiest = Math.max(0, ...[...byDay.values()].map((prices) => prices.length));
    const days = [...byDay.keys()].filter((day) => byDay.get(day)!.length * 2 >= busiest).sort();
    const date = days.at(-1);
    if (!date) return [];
    const previousDate = days.filter((day) => Date.parse(date) - Date.parse(day) >= week).at(-1);
    return [{ name, price: median(byDay.get(date)!), date, previous: previousDate ? median(byDay.get(previousDate)!) : undefined, previousDate }];
  });
}

const monthFile = (date: Date) => `https://storage.data.gov.my/pricecatcher/pricecatcher_${date.toISOString().slice(0, 7)}.parquet`;

async function readMonth(url: string): Promise<Row[]> {
  const response = await fetch(url).catch(() => undefined);
  if (!response?.ok) return [];
  return (await parquetReadObjects({ file: await response.arrayBuffer(), compressors, columns: ["date", "item_code", "price"] })) as Row[];
}

export async function GET(): Promise<Response> {
  // Malaysia time. Early in the month the previous month's file is needed for last week's prices.
  const today = new Date(Date.now() + 8 * 3_600_000);
  const lastMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
  const months = today.getUTCDate() <= 14 ? [lastMonth, today] : [today];
  const rows = (await Promise.all(months.map((month) => readMonth(monthFile(month))))).flat();
  const prices = staplePrices(rows);
  if (!prices.length) return json({ error: "PriceCatcher files were not available" }, 502);
  return json(prices, 200, "public, s-maxage=21600, stale-while-revalidate=86400");
}
