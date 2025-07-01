// Service Worker para Gikamoe - Versão melhorada
// Implementa estratégias de cache inteligentes sem causar erros

const CACHE_NAME = 'gikamoe-v2';
const STATIC_CACHE = 'gikamoe-static-v2';
const DYNAMIC_CACHE = 'gikamoe-dynamic-v2';

// URLs de API que devem ser cached dinamicamente
const API_CACHE_PATTERNS = [
  /\/api\//,
  /\.json$/,
  /\/hub\//
];

// Recursos que devem ser ignorados (Vite dev server)
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

// Instalar o Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v2');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Static cache ready');
      return Promise.resolve();
    })
  );
  
  // Força o SW a ativar imediatamente
  self.skipWaiting();
});

// Ativar o Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v2');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Remove caches antigos
          if (!cacheName.includes('v2')) {
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

// Interceptar requests de forma inteligente
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar recursos de desenvolvimento do Vite
  if (IGNORE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return; // Deixa o Vite lidar com esses recursos
  }
  
  // Ignorar requests para localhost com porta diferente da atual
  if (url.hostname === 'localhost' && url.port !== location.port) {
    return; // Evita erros de CORS e requests para portas incorretas
  }
  
  // Estratégia Network First para APIs - apenas para recursos válidos
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache a resposta se for bem-sucedida
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
          // Se falhar, tenta buscar no cache
          return caches.match(request);
        })
    );
    return;
  }
  
  // Para outros recursos, apenas passa adiante sem cachear
  // (evita problemas com hot-reload do Vite)
  event.respondWith(
    fetch(request).catch((error) => {
      console.log('[SW] Network error:', error);
      return caches.match(request);
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
