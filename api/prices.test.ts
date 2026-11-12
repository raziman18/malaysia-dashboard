import { expect, it } from "vitest";
import { staplePrices } from "./prices";

const row = (date: string, item_code: number, price: number) => ({ date: new Date(date), item_code: BigInt(item_code), price });

it("compares each staple's latest well-reported day with one at least a week earlier, using medians", () => {
  const rows = [
    // Chicken: 3 reports on 1 and 8 Nov, and a thin public holiday on 9 Nov that is skipped.
    ...[7.5, 7.9, 8.5].map((price) => row("2026-11-01", 1, price)),
    ...[7.0, 7.4, 7.6].map((price) => row("2026-11-03", 1, price)),
    ...[7.9, 8.1, 9.0].map((price) => row("2026-11-08", 1, price)),
    row("2026-11-09", 1, 12),
    // Sugar: one survey round only, so there is no earlier price.
    row("2026-11-05", 1589, 2.85),
    // Not a staple.
    row("2026-11-08", 9999, 1),
  ];
  expect(staplePrices(rows)).toEqual([
    { name: "Chicken, standard, 1 kg", price: 8.1, date: "2026-11-08", previous: 7.9, previousDate: "2026-11-01" },
    { name: "White sugar, 1 kg", price: 2.85, date: "2026-11-05", previous: undefined, previousDate: undefined },
  ]);
});
