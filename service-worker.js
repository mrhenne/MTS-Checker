const CACHE_VERSION = 'triageassist-v2-rc5';
const APP_SHELL = [
  './',
  './index.html',
  './css/app.css',
  './data/mts-data.js',
  './data/clinical-addons.js',
  './data/training-cases.js',
  './data/local-sop.js',
  './data/search-aliases.js',
  './tests/triage-regression.js',
  './js/app.js',
  './version.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
