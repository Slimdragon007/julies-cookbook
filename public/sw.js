const CACHE_NAME = 'cookbook-v1';
const STATIC_ASSETS = [
  '/',
  '/login',
  '/demo',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API/pages, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and API routes
  if (event.request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;

  // Static assets: cache-first
  if (url.pathname.match(/\.(png|jpg|jpeg|webp|svg|css|js|woff2?)$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached || fetch(event.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          return res;
        })
      )
    );
    return;
  }

  // Pages: network-first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
