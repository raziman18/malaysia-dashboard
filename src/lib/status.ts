export type Status = "good" | "warning" | "serious" | "critical";

// US AQI bands as published by the US EPA, which Open-Meteo uses.
export function airQualityBand(aqi: number): { label: string; status: Status } {
  if (aqi <= 50) return { label: "Good", status: "good" };
  if (aqi <= 100) return { label: "Moderate", status: "warning" };
  if (aqi <= 150) return { label: "Unhealthy for sensitive groups", status: "serious" };
  return { label: "Unhealthy", status: "critical" };
}
