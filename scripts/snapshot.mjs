// Adds today's figures from the live dashboard to public/history.json. A GitHub Action runs this once a day
// (.github/workflows/snapshot.yml) and commits the file, so the trends panel needs no database.
// Usage: node scripts/snapshot.mjs [site URL]
import { readFileSync, writeFileSync } from "node:fs";

const site = process.argv[2] ?? "https://malaysia-dashboard.vercel.app";
const file = "public/history.json";
const keep = 365;

const response = await fetch(`${site}/api/brief`);
if (!response.ok) throw new Error(`The brief returned ${response.status}`);
const { metrics } = await response.json();
// Malaysia time, so the evening run counts as the same day.
const date = new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10);

const history = JSON.parse(readFileSync(file, "utf8")).filter((entry) => entry.date !== date);
const updated = [...history, { date, ...metrics }].sort((a, b) => a.date.localeCompare(b.date)).slice(-keep);
writeFileSync(file, `${JSON.stringify(updated, null, 1)}\n`);
console.log(`Saved ${date}:`, metrics);
