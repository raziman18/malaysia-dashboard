import { useEffect, useState } from "react";
import type { GlanceItem } from "./lib/glance";

const storageKey = "alerts";
const supported = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
const alertKey = (item: GlanceItem) => `${item.id}|${item.value}|${item.detail}`;

// Browser storage can be missing or blocked, so alerts then start switched off.
function load(): { enabled: boolean; seen: string[] } {
  try {
    return { enabled: false, seen: [], ...JSON.parse(localStorage.getItem(storageKey) ?? "{}") };
  } catch {
    return { enabled: false, seen: [] };
  }
}

function save(enabled: boolean, seen: string[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ enabled, seen: seen.slice(-50) }));
  } catch {
    // Alerts still work for this visit.
  }
}

// Shows a phone or desktop notification for each new urgent item while the dashboard is open, including in a
// background tab. Items already on screen when alerts are switched on do not trigger one.
export function useAlerts(urgent: GlanceItem[]) {
  const [enabled, setEnabled] = useState(() => supported && Notification.permission === "granted" && load().enabled);
  const keys = urgent.map(alertKey).join("\n");

  useEffect(() => {
    if (!enabled) return;
    const { seen } = load();
    const fresh = urgent.filter((item) => !seen.includes(alertKey(item)));
    if (!fresh.length) return;
    navigator.serviceWorker.ready.then((registration) =>
      fresh.forEach((item) => registration.showNotification(`${item.label}: ${item.value}`, { body: item.detail, icon: "/icon-192.png", tag: item.id })),
    );
    save(true, [...seen, ...fresh.map(alertKey)]);
    // keys stands in for urgent, which is a new array on every render.
  }, [enabled, keys]);

  async function toggle() {
    if (enabled) {
      save(false, load().seen);
      setEnabled(false);
    } else if ((await Notification.requestPermission()) === "granted") {
      save(true, [...load().seen, ...urgent.map(alertKey)]);
      setEnabled(true);
    }
  }

  return { supported, enabled, toggle };
}
