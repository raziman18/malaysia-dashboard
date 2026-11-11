import { useEffect, useState } from "react";
import { fetchAirQuality, fetchEarthquakes, fetchExchangeRates, fetchFloodStations, fetchHeadlines, fetchKlci, fetchWeatherWarnings } from "./api";
import { EconomyPanel } from "./components/EconomyPanel";
import { GlanceStrip } from "./components/GlanceStrip";
import { HazardPanel } from "./components/HazardPanel";
import { HealthSafetyPanel } from "./components/HealthSafetyPanel";
import { NewsPanel } from "./components/NewsPanel";
import { useFetch } from "./useFetch";

const loadTopNews = () => fetchHeadlines("Malaysia");
const loadFloodNews = () => fetchHeadlines("Malaysia flood OR banjir");
const selectUsdRate = (rates: Awaited<ReturnType<typeof fetchExchangeRates>>) => rates.find((rate) => rate.code === "USD")?.ringgit;

export function App() {
  const warnings = useFetch(fetchWeatherWarnings);
  const air = useFetch(fetchAirQuality);
  const rates = useFetch(fetchExchangeRates);
  const topNews = useFetch(loadTopNews);
  const floodStations = useFetch(fetchFloodStations);
  const floodNews = useFetch(loadFloodNews);
  const earthquakes = useFetch(fetchEarthquakes);
  const klci = useFetch(fetchKlci);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main>
      <header>
        <div>
          <h1>Malaysia Daily Brief</h1>
          <p className="muted">Live public data. Every feed refreshes every 10 minutes.</p>
        </div>
        <time dateTime={now.toISOString()}>
          {now.toLocaleString("en-MY", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" })} MYT
        </time>
      </header>
      <GlanceStrip
        warnings={warnings}
        air={air}
        usdRate={{ data: rates.data && selectUsdRate(rates.data) }}
        topNews={topNews}
        floodStations={floodStations}
        floodNews={floodNews}
        earthquakes={earthquakes}
        klci={klci}
      />
      <div className="grid">
        <HazardPanel warnings={warnings} air={air} stations={floodStations} floodNews={floodNews} />
        <EconomyPanel rates={rates} klci={klci} />
        <HealthSafetyPanel earthquakes={earthquakes} />
        <NewsPanel topNews={topNews} />
      </div>
    </main>
  );
}
