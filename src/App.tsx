import { useEffect, useState } from "react";
import { fetchAirQuality, fetchBrief, fetchEarthquakes, fetchExchangeRates, fetchFloodStations, fetchKlci, fetchNewsReport, fetchWeatherWarnings } from "./api";
import { CategoryNav } from "./components/CategoryNav";
import { EconomyPanel } from "./components/EconomyPanel";
import { GlanceStrip, glanceInputs, type GlanceFeeds } from "./components/GlanceStrip";
import { HazardPanel } from "./components/HazardPanel";
import { HealthSafetyPanel } from "./components/HealthSafetyPanel";
import { NewsPanel } from "./components/NewsPanel";
import { ParliamentPanel } from "./components/ParliamentPanel";
import { SourcesPanel } from "./components/SourcesPanel";
import { TrendsPanel } from "./components/TrendsPanel";
import { AiSummary } from "./components/ui";
import { categoryFromHash } from "./lib/categories";
import { urgentItems } from "./lib/glance";
import { needsAttention } from "./lib/health";
import { filterByTopic } from "./lib/topics";
import { useAlerts } from "./useAlerts";
import { useFetch } from "./useFetch";
import { useSourceHealth } from "./useSourceHealth";

const selectUsdRate = (rates: Awaited<ReturnType<typeof fetchExchangeRates>>) => rates.find((rate) => rate.code === "USD")?.ringgit;

export function App() {
  const warnings = useFetch(fetchWeatherWarnings);
  const air = useFetch(fetchAirQuality);
  const rates = useFetch(fetchExchangeRates);
  const newsReport = useFetch(fetchNewsReport);
  const loadedNews = { ...newsReport, data: newsReport.data?.headlines };
  const sources = useSourceHealth();
  const attention = needsAttention(sources);
  const brief = useFetch(fetchBrief);
  const summaries = brief.data?.summaries ?? {};
  const news = { ...loadedNews, data: loadedNews.data?.map((headline) => ({ ...headline, ...brief.data?.labels[headline.title] })) };
  const floodNews = { ...news, data: news.data && filterByTopic(news.data, "flood") };
  const floodStations = useFetch(fetchFloodStations);
  const earthquakes = useFetch(fetchEarthquakes);
  const klci = useFetch(fetchKlci);
  const glanceFeeds: GlanceFeeds = {
    warnings,
    air,
    usdRate: { data: rates.data && selectUsdRate(rates.data) },
    topNews: news,
    floodStations,
    floodNews,
    earthquakes,
    klci,
  };
  const alerts = useAlerts(urgentItems(glanceInputs(glanceFeeds)));
  const [now, setNow] = useState(new Date());
  const [category, setCategory] = useState(() => categoryFromHash(location.hash));
  const shows = (id: string) => category === "all" || category === id;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      setCategory(categoryFromHash(location.hash));
      scrollTo({ top: 0 });
    };
    addEventListener("hashchange", onHashChange);
    return () => removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <main>
      <header>
        <div>
          <h1>Malaysia Daily Brief</h1>
          <p className="muted">Live public data. Every feed refreshes every 10 minutes.</p>
          {attention.length > 0 && (
            <p className="source-notice">
              <a href="#sources">
                {attention.length} {attention.length === 1 ? "source needs" : "sources need"} attention
              </a>
              : {attention.map((source) => `${source.name} (${source.label.toLowerCase()})`).join(", ")}
            </p>
          )}
        </div>
        <div className="header-actions">
          <time dateTime={now.toISOString()}>
            {now.toLocaleString("en-MY", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" })} MYT
          </time>
          {alerts.supported && (
            <button className="alerts-button" aria-pressed={alerts.enabled} onClick={alerts.toggle} title="Alerts for urgent events while this page is open. On iPhone, add the dashboard to the home screen first.">
              {alerts.enabled ? "Alerts on" : "Turn on alerts"}
            </button>
          )}
        </div>
      </header>
      <div className="layout">
        <CategoryNav selected={category} />
        <div>
          {category === "all" && (
            <>
              <AiSummary title="Today's brief" summary={summaries.daily} />
              <GlanceStrip {...glanceFeeds} />
            </>
          )}
          <div className={category === "all" ? "grid" : "grid single"}>
            {shows("hazards") && <HazardPanel warnings={warnings} air={air} stations={floodStations} floodNews={floodNews} summary={summaries.hazards} />}
            {shows("economy") && <EconomyPanel rates={rates} klci={klci} summary={summaries.economy} />}
            {shows("health") && <HealthSafetyPanel earthquakes={earthquakes} news={news} summary={summaries.health} />}
            {shows("news") && <NewsPanel news={news} summary={summaries.news} />}
            {shows("parliament") && <ParliamentPanel news={news} summary={summaries.parliament} />}
            {shows("trends") && <TrendsPanel />}
            {shows("sources") && <SourcesPanel sources={sources} />}
          </div>
        </div>
      </div>
    </main>
  );
}
