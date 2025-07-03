/**
 * Hook para integração e controle do Service Worker
 * AIDEV-NOTE: Manages SW registration, updates and messaging
 */

import { useEffect, useState } from 'react';

export const useServiceWorker = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [swRegistered, setSwRegistered] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Forçar desregistro completo do Service Worker para resolver problemas de CORS
    const forceUnregisterSW = async () => {
      // Verificar se já foi executado para evitar loop infinito
      const swCleanupKey = 'gikamoe-sw-cleanup-done';
      if (sessionStorage.getItem(swCleanupKey)) {
        console.log('✅ [SW] Limpeza já foi executada nesta sessão');
        return;
      }

      console.log('🚫 [DEV] Forçando desregistro COMPLETO de todos os Service Workers...');
      
      if ('serviceWorker' in navigator) {
        try {
          // 1. Desregistrar todas as registrations
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
          
          // 2. Limpar todos os caches
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            for (const cacheName of cacheNames) {
              console.log('🗑️ Removendo cache:', cacheName);
              await caches.delete(cacheName);
            }
          }
          
          console.log('✅ Service Workers e caches completamente removidos');
          
          // Marcar como concluído ANTES de recarregar
          sessionStorage.setItem(swCleanupKey, 'true');
          
          // 3. Recarregar APENAS uma vez
          console.log('🔄 Recarregando página para aplicar mudanças...');
          window.location.reload(true);
          
        } catch (error) {
          console.error('❌ Erro ao desregistrar Service Workers:', error);
          sessionStorage.setItem(swCleanupKey, 'error');
        }
      }
    };

    // Em desenvolvimento, tentar desregistrar (mas apenas uma vez por sessão)
    const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
    
    if (isDevelopment) {
      forceUnregisterSW();
      return;
    }

    /*
    // Código original comentado
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
      */
    
    // Chama a função de desregistro em vez de registro
    // registerSW();

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
