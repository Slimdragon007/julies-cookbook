// Bumped from v2 → v3 on 2026-04-28 to evict the stale-while-revalidate
// HTML cache that was hiding newly-added recipes from the gallery (TASK-009).
const CACHE_NAME = "cookbook-v3";

// Install: skip waiting to activate immediately
self.addEventListener("install", () => {
  self.skipWaiting();
});

// Activate: clean old caches, claim all clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Fetch handler with route-specific strategies
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests (mutations always go to server)
  if (event.request.method !== "GET") return;

  // Skip API routes entirely (auth-gated, can't cache)
  if (url.pathname.startsWith("/api/")) return;

  // Skip Supabase/external API calls
  if (!url.origin.includes(self.location.origin)) {
    // Exception: cache Cloudinary images aggressively
    if (url.hostname === "res.cloudinary.com") {
      event.respondWith(cacheFirst(event.request, 30 * 24 * 60 * 60)); // 30 days
      return;
    }
    return;
  }

  // Static assets (hashed filenames): cache-first, immutable
  if (url.pathname.match(/\/_next\/static\/.+\.(js|css|woff2?)$/)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Images: cache-first with long TTL
  if (url.pathname.match(/\.(png|jpg|jpeg|webp|avif|svg|gif|ico)$/)) {
    event.respondWith(cacheFirst(event.request, 7 * 24 * 60 * 60)); // 7 days
    return;
  }

  // HTML / page navigations: pass through to the network. User-scoped pages
  // (gallery, /log, /grocery-list, /recipe/*) silently hid newly-added recipes
  // when SWR served stale HTML with no mutation-bust hook (TASK-009). Static
  // assets and Cloudinary images above keep their cache-first strategies, so
  // the perf win on repeat loads is preserved.
  return;
});

// Strategy: Cache-first (for immutable assets)
async function cacheFirst(request, maxAgeSec) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}
