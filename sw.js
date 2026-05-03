const CACHE = 'mathaino-v1';

const PRECACHE = [
  '/',
  '/index.html',
  '/src/app.js',
  '/src/style.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/data/words.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Only handle same-origin GETs
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cache audio and images as they are fetched
        if (url.pathname.startsWith('/audio/') || url.pathname.startsWith('/images/')) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached); // offline fallback
    })
  );
});
