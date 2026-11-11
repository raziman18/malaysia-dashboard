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

## Known limits

- data.gov.my limits anonymous use. To raise the limit, request a token from data.gov.my and set `DATA_GOV_MY_TOKEN` in your environment (locally) or in the Vercel project settings.
- Topic tabs and the health, safety and flood lists use keyword filters, so a story can occasionally land under the wrong topic.
- The JPS river level feed on data.gov.my stopped updating in February 2024. The dashboard detects this and shows flood news instead.
- Yahoo Finance's chart API is unofficial and may change.
- Headline tone is a keyword count, not a survey of public opinion.
