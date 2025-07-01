// Service Worker para Gikamoe
// Implementa estratégias de cache para melhor performance offline

const CACHE_NAME = 'gikamoe-v1';
const STATIC_CACHE = 'gikamoe-static-v1';
const DYNAMIC_CACHE = 'gikamoe-dynamic-v1';

// URLs que devem ser cached estaticamente
const STATIC_URLS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// URLs de API que devem ser cached dinamicamente
const API_CACHE_PATTERNS = [
  /\/api\//,
  /\.json$/,
  /\/hub\//
];

// Instalar o Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_URLS);
    })
  );
  
  // Força o SW a ativar imediatamente
  self.skipWaiting();
});

// Ativar o Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Remove caches antigos
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Assume controle imediatamente
  self.clients.claim();
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Estratégia Cache First para assets estáticos
  if (STATIC_URLS.some(staticUrl => url.pathname.includes(staticUrl))) {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request);
      })
    );
    return;
  }
  
  // Estratégia Network First para APIs
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache a resposta se for bem-sucedida
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Se falhar, tenta buscar no cache
          return caches.match(request);
        })
    );
    return;
  }
  
  // Estratégia Stale While Revalidate para outros recursos
  event.respondWith(
    caches.match(request).then((response) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        // Cache a nova resposta
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      });
      
      // Retorna cache se disponível, senão espera a rede
      return response || fetchPromise;
    })
  );
});

// Lidar com mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notificar sobre atualizações
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
