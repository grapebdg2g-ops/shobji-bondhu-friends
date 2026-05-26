// Krishi Bondhu Service Worker
// Hand-written SW (no vite-plugin-pwa) so it does not interfere with the
// Lovable preview iframe — registration is guarded in pwa-manager.tsx.

const VERSION = "v1";
const SUPABASE_CACHE = `supabase-${VERSION}`;
const IMAGE_CACHE = `images-${VERSION}`;
const PAGE_CACHE = `pages-${VERSION}`;
const ALL_CACHES = [SUPABASE_CACHE, IMAGE_CACHE, PAGE_CACHE];

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => !ALL_CACHES.includes(n)).map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

// Helpers
async function networkFirst(req, cacheName, maxEntries, maxAgeSeconds) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(req);
    if (fresh && fresh.status === 200) {
      cache.put(req, fresh.clone());
      trimCache(cacheName, maxEntries);
    }
    return fresh;
  } catch (e) {
    const cached = await cache.match(req);
    if (cached) return cached;
    // Fallback to offline page for navigations
    if (req.mode === "navigate") {
      const offline = await cache.match("/offline");
      if (offline) return offline;
    }
    throw e;
  }
}

async function cacheFirst(req, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  const fresh = await fetch(req);
  if (fresh && fresh.status === 200) {
    cache.put(req, fresh.clone());
    trimCache(cacheName, maxEntries);
  }
  return fresh;
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    const excess = keys.length - maxEntries;
    for (let i = 0; i < excess; i++) await cache.delete(keys[i]);
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // 1. Supabase API — NetworkFirst (24h, 200 entries)
  if (/\.supabase\.co$/.test(url.hostname)) {
    // Skip auth + realtime
    if (url.pathname.startsWith("/auth/") || url.pathname.startsWith("/realtime/")) return;
    event.respondWith(networkFirst(request, SUPABASE_CACHE, 200, 24 * 60 * 60));
    return;
  }

  // 2. Images — CacheFirst (7d, 100 entries)
  if (/\.(?:png|jpg|jpeg|webp|svg|gif|ico)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, 100));
    return;
  }

  // 3. HTML navigations — NetworkFirst (24h, 50 entries)
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(networkFirst(request, PAGE_CACHE, 50, 24 * 60 * 60));
    return;
  }
});
