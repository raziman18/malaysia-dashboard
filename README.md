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
| Disasters and weather | Active weather warnings, flood news, air quality in 16 state capitals | MET Malaysia and JPS (data.gov.my), Open-Meteo, Google News |
| Economy | Exchange rates, fuel prices, inflation, unemployment, FBM KLCI | Bank Negara Malaysia, data.gov.my, Yahoo Finance |
| Public health and safety | Daily blood donations, health and incident news, regional earthquakes | data.gov.my, Google News |
| News and sentiment | Top stories by topic with a headline tone score | Google News |

## Known limits

- The dev server forwards API calls to get around browser CORS blocks. A production build needs the same forwarding from a small server.
- data.gov.my limits anonymous use. The dev server caches its replies for 10 minutes and retries when throttled. To raise the limit, request a token from data.gov.my and set `DATA_GOV_MY_TOKEN` in your environment.
- The JPS river level feed on data.gov.my stopped updating in February 2024. The dashboard detects this and shows flood news instead.
- Yahoo Finance's chart API is unofficial and may change.
- Headline tone is a keyword count, not a survey of public opinion.
