# Malaysia Daily Brief

A one-page dashboard of what is happening in Malaysia today, built from live public data. Works on phones and desktops.

```sh
npm install
npm run dev     # http://localhost:5173
npm test
```

## Panels and sources

| Panel | Data | Source |
|---|---|---|
| Disasters and weather | A state map of current issues, active weather warnings, live rain radar, flood news, air quality in 16 state capitals | MET Malaysia and JPS (data.gov.my), MET radar, Open-Meteo, news outlets |
| Economy | Exchange rates, fuel prices and their weekly change, staple food prices, GDP, inflation, unemployment, FBM KLCI | Bank Negara Malaysia, data.gov.my, PriceCatcher (`api/prices.ts`), Yahoo Finance |
| Public health and safety | Daily blood donations, health and incident news, regional earthquakes | data.gov.my, news outlets |
| News and sentiment | Stories with photos by topic, with a headline tone score | Free Malaysia Today, Malay Mail, New Straits Times, Astro Awani, Utusan Malaysia, Sinar Harian |

## State map

The map colours each state by its worst current issue (`stateIssues` in `src/lib/states.ts`): weather warnings that name the state (sea warnings count lower), air that is unhealthy for sensitive groups or worse in its capital, rivers above normal when the JPS feed is fresh, and flood news that names the state. The boundaries come from DOSM's open data (DOSM Open Data Licence) and are turned into SVG paths by `scripts/build-state-shapes.mjs`.

## Install and alerts

The dashboard can be installed as an app from the browser menu ("Add to home screen" or "Install app"). "Turn on alerts" sends a notification for each new urgent item, using the same rules as the top four boxes (`urgentItems` in `src/lib/glance.ts`): very unhealthy air, rivers at warning or danger level, a strong nearby earthquake, or a KLCI move of 2% or more. Alerts arrive only while the dashboard is open, including in a background tab, because the site has no server that stores subscriptions. On iPhone, notifications work only after adding the dashboard to the home screen.

## Deploying

The browser cannot call most of these APIs directly (CORS), so every request goes through `/api/...` paths.

- In development, the Vite dev server forwards them (`vite.config.ts`).
- On Vercel, `vercel.json` forwards them, and `api/gov.ts` handles data.gov.my so Vercel's CDN can cache its replies for 10 minutes across all visitors.

## Environment variables

Set these in `.env.local` for local development and in the Vercel project settings for production. Both are optional.

| Name | Used for |
|---|---|
| `GROQ_API_KEY` | AI headline labels and summaries (`api/brief.ts`). Get a free key at console.groq.com. Without it, tone falls back to keyword guesses and the summaries are hidden. |
| `DATA_GOV_MY_TOKEN` | Raises the data.gov.my rate limit. |

## AI labels and summaries

`api/brief.ts` prepares everything the AI adds, and the browser loads it in one request:

- **Labels.** Each current headline gets a tone (positive, neutral or negative) and its topics (flood, health, safety, economy, politics) from `api/label.ts`, which uses `openai/gpt-oss-20b` on Groq and the same guide as the hand-labelled test set in `src/lib/fixtures/headline-tone.txt`. Until a label arrives, the dashboard shows the keyword guess marked with a `?` and sorts the story into topics by keywords. Sabah and Sarawak stories are always found by place names.
- **Summaries.** The brief builds plain-text facts for each panel from the same public feeds (`src/lib/facts.ts`), and `api/summary.ts` asks `openai/gpt-oss-120b` to summarise only those facts. A daily brief at the top summarises all panels together. Summaries can still contain mistakes, and the page says so.

Only `/api/brief` can make the label and summary routes call Groq (it sends a key derived from `GROQ_API_KEY`), so visitors cannot spend the free quota on their own text. Each headline and each set of facts has its own URL, and Vercel's CDN keeps those answers for 30 days, so nothing is sent to Groq twice. The brief itself is kept for 30 minutes, or 2 minutes while some labels are still missing.

On the 89 hand-labelled headlines, the AI labelled 83% and 88% of tones correctly in two runs. The keyword method scores 56%, and labelling everything neutral would score 62%.

## Known limits

- data.gov.my limits anonymous use. To raise the limit, request a token from data.gov.my and set `DATA_GOV_MY_TOKEN` in your environment (locally) or in the Vercel project settings.
- Topic tabs and the health, safety and flood lists use keyword filters until the AI labels arrive, so a story can briefly land under the wrong topic.
- The JPS river level feed on data.gov.my stopped updating in February 2024. The dashboard detects this and shows flood news instead.
- Yahoo Finance's chart API is unofficial and may change.
- Headline tone describes what each story reports. It is not a survey of public opinion.
- Groq's free tier limits tokens per day. On a very busy news day, labels or summaries can pause until the limit resets, and the dashboard falls back to keyword guesses.
