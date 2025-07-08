/**
 * Hook para integração e controle do Service Worker
 * AIDEV-NOTE: Manages SW registration, updates and messaging with dev mode cleanup
 */

import { useEffect, useState } from 'react';

export const useServiceWorker = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);    const [_swRegistered, _setSwRegistered] = useState(false);
    const [_updateAvailable, _setUpdateAvailable] = useState(false);

  useEffect(() => {
    // AIDEV-NOTE: Force complete SW unregistration to resolve CORS issues in dev
    const forceUnregisterSW = async () => {
      // AIDEV-NOTE: Check if already executed to avoid infinite loop
      const swCleanupKey = 'gikamoe-sw-cleanup-done';
      if (sessionStorage.getItem(swCleanupKey)) {
        console.log('✅ [SW] Limpeza já foi executada nesta sessão');
        return;
      }

      console.log('🚫 [DEV] Forçando desregistro COMPLETO de todos os Service Workers...');
      
      if ('serviceWorker' in navigator) {
        try {
          // AIDEV-NOTE: 1. Unregister all registrations
          const registrations = await navigator.serviceWorker.getRegistrations();
          
          if (registrations.length === 0) {
            console.log('✅ [SW] Nenhum Service Worker encontrado');
            sessionStorage.setItem(swCleanupKey, 'true');
            return;
          }
          
          for (const registration of registrations) {
            console.log('🗑️ Desregistrando Service Worker:', registration.scope);
            await registration.unregister();
          }
          
          // AIDEV-NOTE: 2. Clear all caches
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            for (const cacheName of cacheNames) {
              console.log('🗑️ Removendo cache:', cacheName);
              await caches.delete(cacheName);
            }
          }
          
          console.log('✅ Service Workers e caches completamente removidos');
          
          // AIDEV-NOTE: Mark as completed BEFORE reloading
          sessionStorage.setItem(swCleanupKey, 'true');
          
          // AIDEV-NOTE: 3. Reload ONLY once
          console.log('🔄 Recarregando página para aplicar mudanças...');
          window.location.reload(true);
          
        } catch (error) {
          console.error('❌ Erro ao desregistrar Service Workers:', error);
          sessionStorage.setItem(swCleanupKey, 'error');
        }
      }
    };

    // AIDEV-NOTE: In development, try to unregister (but only once per session)
    const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
    
    if (isDevelopment) {
      forceUnregisterSW();
      return;
    }

    /*
    // AIDEV-NOTE: Original code commented out - SW registration for production
    const registerSW = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          
          console.log('Service Worker registrado:', registration);
          setSwRegistered(true);

          // AIDEV-NOTE: Check for updates
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

          // AIDEV-NOTE: Check for updates every 5 minutes
          setInterval(() => {
            registration.update();
          }, 5 * 60 * 1000);

        } catch (error) {
          console.error('Erro ao registrar Service Worker:', error);
        }
      }
      */
    
    // AIDEV-NOTE: Monitor connectivity status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // AIDEV-NOTE: Function to apply updates with page reload
  const applyUpdate = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  // AIDEV-NOTE: Function to check cache size in MB
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

  // AIDEV-NOTE: Function to clear all caches
  const clearCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('Cache limpo');
    }
  };

  return {
    isOnline,
    _swRegistered,
    _updateAvailable,
    applyUpdate,
    getCacheSize,
    clearCache
  };
};
