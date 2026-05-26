// Minimal service worker for push notifications.
// NOTE: This file is registered ONLY in production (see pwa-manager.tsx),
// never inside the Lovable preview iframe.

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = { title: "কৃষিবন্ধু", body: "নতুন বিজ্ঞপ্তি", url: "/dashboard" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (_) {
    // fallback to defaults
  }
  const options = {
    body: payload.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload.type || "krishi-notif",
    data: { url: payload.url || "/dashboard" },
    vibrate: payload.severity === "high" ? [200, 100, 200, 100, 200] : [100],
    requireInteraction: payload.severity === "high",
  };
  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/dashboard";
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of allClients) {
      if ("focus" in client) {
        client.navigate(url);
        return client.focus();
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  })());
});
