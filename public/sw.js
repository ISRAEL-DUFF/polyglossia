const CACHE_NAME = 'polyglossia-praxis-cache-v1';
// Add paths to assets that are crucial for the app shell to function offline.
// For a Next.js 'export' build, these will typically be HTML files and critical JS/CSS.
// This list will need to be refined based on your actual build output for optimal offline experience.
const urlsToCache = [
  '/',
  '/index.html', // Often the root for exported sites
  '/greek.html',
  '/greek-prepositions.html',
  '/vocabulary-browser.html',
  '/hebrew.html',
  '/hebrew-morph-builder.html',
  '/matching-game.html',
  '/parser-game.html',
  '/flashcard-game.html',
  // Add other critical pages/routes if they are static HTML files after export
  // e.g., '/greek/', '/hebrew/' - these would become /greek/index.html etc.
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
  // Critical JS/CSS chunks can be added here too, but Next.js's hashing helps with browser caching.
  // For a robust offline PWA, consider using Workbox via a library like next-pwa.
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Opened cache:', CACHE_NAME);
        // Filter out URLs that might not exist in dev (like specific _next/static assets)
        // or adjust based on your production build.
        const urlsToActuallyCache = urlsToCache.filter(url => !url.startsWith('/_next/static/'));
        return cache.addAll(urlsToActuallyCache);
      })
      .catch(error => {
        console.error('[Service Worker] Cache addAll failed:', error);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // We only want to handle GET requests with our caching strategy
  if (event.request.method !== 'GET') {
    return;
  }

  // Cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // console.log('[Service Worker] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // console.log('[Service Worker] Fetching from network:', event.request.url);
        return fetch(event.request).then((networkResponse) => {
          // Optional: Cache new requests dynamically if needed.
          // Be careful with caching everything, especially API responses or non-static assets.
          // Example: if (networkResponse && networkResponse.status === 200 && event.request.url.includes('/_next/static/')) {
          //   const responseToCache = networkResponse.clone();
          //   caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
          // }
          if (networkResponse && networkResponse.status === 200 && event.request.url.includes('/_next/static/')) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        }).catch(error => {
          console.error('[Service Worker] Fetch failed; returning offline page if available, or error:', error);
          // Optionally, return a generic offline fallback page:
          // return caches.match('/offline.html'); 
        });
      })
  );
});
