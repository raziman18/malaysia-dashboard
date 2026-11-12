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
| Disasters and weather | Active weather warnings, live rain radar, flood news, air quality in 16 state capitals | MET Malaysia and JPS (data.gov.my), MET radar, Open-Meteo, news outlets |
| Economy | Exchange rates, fuel prices, inflation, unemployment, FBM KLCI | Bank Negara Malaysia, data.gov.my, Yahoo Finance |
| Public health and safety | Daily blood donations, health and incident news, regional earthquakes | data.gov.my, news outlets |
| News and sentiment | Stories with photos by topic, with a headline tone score | Free Malaysia Today, Malay Mail, New Straits Times |

## Deploying

The browser cannot call most of these APIs directly (CORS), so every request goes through `/api/...` paths.

- In development, the Vite dev server forwards them (`vite.config.ts`).
- On Vercel, `vercel.json` forwards them, and `api/gov.ts` handles data.gov.my so Vercel's CDN can cache its replies for 10 minutes across all visitors.

## Environment variables

Set these in `.env.local` for local development and in the Vercel project settings for production. Both are optional.

| Name | Used for |
|---|---|
| `GROQ_API_KEY` | AI headline tone labels (`api/tone.ts`) and panel summaries (`api/summary.ts`). Get a free key at console.groq.com. Without it, tone falls back to keyword guesses and the summaries are hidden. |
| `DATA_GOV_MY_TOKEN` | Raises the data.gov.my rate limit. |

## Headline tone

`api/tone.ts` asks a Groq-hosted model (`openai/gpt-oss-20b`) to label each headline positive, neutral or negative, using the same guide as the hand-labelled test set in `src/lib/fixtures/headline-tone.txt`. Each headline has its own URL and Vercel's CDN keeps the label for 30 days, so a headline is labelled once however many people visit. That keeps usage inside Groq's free daily token limit. Until a label arrives, the dashboard shows the keyword guess marked with a `?`.

On the 89 hand-labelled headlines, the AI labels 83% correctly. The keyword method scores 56%, and labelling everything neutral would score 62%.

## AI summaries

Each panel opens with a two or three sentence summary. The panel turns its data into plain-text facts (`src/lib/facts.ts`) and `api/summary.ts` asks the same Groq model to summarise only those facts. The facts are part of the URL, so Vercel's CDN reuses a summary until the data behind it changes. Summaries can still contain mistakes, and the panel says so.

## Known limits

- data.gov.my limits anonymous use. To raise the limit, request a token from data.gov.my and set `DATA_GOV_MY_TOKEN` in your environment (locally) or in the Vercel project settings.
- Topic tabs and the health, safety and flood lists use keyword filters, so a story can occasionally land under the wrong topic.
- The JPS river level feed on data.gov.my stopped updating in February 2024. The dashboard detects this and shows flood news instead.
- Yahoo Finance's chart API is unofficial and may change.
- Headline tone describes what each story reports. It is not a survey of public opinion.
- Anyone who finds `/api/tone` or `/api/summary` can spend the Groq free quota by sending made-up headlines. The free tier has no charges, but labelling would pause until the daily limit resets.
