const CACHE = 'lingocards-v17';
const SCOPE = self.registration.scope; // works at root or subpath (e.g. /flashcards/)

const PRECACHE = [
  SCOPE,
  SCOPE + 'index.html',
  SCOPE + 'src/app.js',
  SCOPE + 'src/style.css',
  SCOPE + 'manifest.json',
  SCOPE + 'icon-192.png',
  SCOPE + 'icon-512.png',
  SCOPE + 'data/manifest.json',
  SCOPE + 'data/decks/greek.json',
  SCOPE + 'data/decks/albanian.json',
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
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cache audio and images as they are fetched
        if (event.request.url.startsWith(SCOPE) &&
            (url.pathname.includes('/audio/') || url.pathname.includes('/images/'))) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
