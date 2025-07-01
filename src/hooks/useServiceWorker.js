import { useEffect, useState } from 'react';

export const useServiceWorker = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [swRegistered, setSwRegistered] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Registrar Service Worker
    const registerSW = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          
          console.log('Service Worker registrado:', registration);
          setSwRegistered(true);

          // Verificar por atualizações
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });

          // Verificar por atualizações a cada 5 minutos
          setInterval(() => {
            registration.update();
          }, 5 * 60 * 1000);

        } catch (error) {
          console.error('Erro ao registrar Service Worker:', error);
        }
      }
    };

    registerSW();

    // Monitorar status de conectividade
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Função para aplicar atualização
  const applyUpdate = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  // Função para verificar tamanho do cache
  const getCacheSize = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      }
      
      return Math.round(totalSize / 1024 / 1024 * 100) / 100; // MB
    }
    return 0;
  };

  // Função para limpar cache
  const clearCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('Cache limpo');
    }
  };

  return {
    isOnline,
    swRegistered,
    updateAvailable,
    applyUpdate,
    getCacheSize,
    clearCache
  };
};
