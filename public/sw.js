// AIDEV-NOTE: Service Worker with intelligent caching strategies and dev mode detection
// Service Worker para Gikamoe - Versão melhorada
// Implementa estratégias de cache inteligentes sem causar erros

const CACHE_NAME = 'gikamoe-v2';
const STATIC_CACHE = 'gikamoe-static-v2';
const DYNAMIC_CACHE = 'gikamoe-dynamic-v2';

// AIDEV-NOTE: API URLs that should be cached dynamically
const API_CACHE_PATTERNS = [
  /\/api\//,
  /\.json$/,
  /\/hub\//
];

// AIDEV-NOTE: Resources to ignore (Vite dev server specific)
const IGNORE_PATTERNS = [
  /@vite/,
  /@react-refresh/,
  /\.jsx\?/,
  /\.ts\?/,
  /\.tsx\?/,
  /hot-update/,
  /sockjs-node/,
  /webpack-dev-server/
];

// AIDEV-NOTE: Install SW with static cache preparation and skip waiting
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v2');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Static cache ready');
      return Promise.resolve();
    })
  );
  
  // AIDEV-NOTE: Forces SW to activate immediately
  self.skipWaiting();
});

// AIDEV-NOTE: Activate SW with old cache cleanup and immediate control
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v2');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // AIDEV-NOTE: Remove old caches not matching current version
          if (!cacheName.includes('v2')) {
            console.log('[SW] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // AIDEV-NOTE: Take control immediately
  self.clients.claim();
});

// AIDEV-NOTE: Smart request interception with dev mode detection
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // AIDEV-NOTE: In development, don't intercept ANY request to avoid conflicts
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.includes('dev')) {
    console.log('[SW] Development mode detected, bypassing request:', url.href);
    return; // Let browser handle all requests
  }
  
  // AIDEV-NOTE: Ignore Vite development resources
  if (IGNORE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return; // Let Vite handle these resources
  }
  
  // AIDEV-NOTE: Ignore requests to localhost with different port
  if (url.hostname === 'localhost' && url.port !== location.port) {
    return; // Avoid CORS errors and incorrect port requests
  }
  
  // AIDEV-NOTE: Only in production, use cache for APIs
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // AIDEV-NOTE: Cache response if successful
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            }).catch(err => console.log('[SW] Cache error:', err));
          }
          return response;
        })
        .catch((error) => {
          console.log('[SW] Network error for API request:', error);
          // AIDEV-NOTE: If fails, try to fetch from cache
          return caches.match(request);
        })
    );
    return;
  }
  
  // AIDEV-NOTE: For other resources, just pass through without caching to avoid hot-reload issues
  event.respondWith(
    fetch(request).catch((error) => {
      console.log('[SW] Network error:', error);
      return caches.match(request);
    })
  );
});

// AIDEV-NOTE: Handle client messages for skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// AIDEV-NOTE: Notify about updates and version info
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
