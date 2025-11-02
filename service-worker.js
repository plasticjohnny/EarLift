// Network-first strategy - always fetch fresh content, no caching during development
const CACHE_NAME = 'earlift-no-cache-v27';

// Install event - skip caching
self.addEventListener('install', (event) => {
  console.log('Service Worker installed - no caching enabled');
  self.skipWaiting();
});

// Activate event - clear all caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - always use network, never cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request, {
      cache: 'no-store'
    }).catch(() => {
      // If network fails, return a basic error response
      return new Response('Network error occurred', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
          'Content-Type': 'text/plain'
        })
      });
    })
  );
});
