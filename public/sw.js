// Phones need a service worker to show alerts and to install the dashboard as an app. It does not cache anything,
// so the dashboard always shows live data.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((windows) => (windows.length ? windows[0].focus() : self.clients.openWindow("/"))),
  );
});
