const CACHE_NAME = 'my-finance-v5';
const ASSETS = [
  '/My-Finance-Tracker/',
  '/My-Finance-Tracker/index.html',
  '/My-Finance-Tracker/manifest.json',
  '/My-Finance-Tracker/icon-192.png',
  '/My-Finance-Tracker/icon-512.png'
];

// Install — cache assets but don't skip waiting
// This prevents forcing a reload mid-session which can disrupt data
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(ASSETS.map(url => cache.add(url)));
    })
  );
  // Don't call skipWaiting() — wait for user to close all tabs first
  // This protects localStorage data from being disrupted
});

// Activate — clean old caches but don't claim immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => {
            console.log('My Finance: removing old cache', k);
            return caches.delete(k);
          })
      )
    )
  );
  // Only claim after old caches are cleared
  return self.clients.claim();
});

// Fetch — network first, fall back to cache
// Network-first ensures users always get latest version when online
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If we got a valid response, update the cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline — serve from cache
        return caches.match(event.request).then(cached => {
          return cached || caches.match('/My-Finance-Tracker/index.html');
        });
      })
  );
});
