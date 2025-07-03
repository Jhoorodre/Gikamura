/**
 * Utilitários para debug de rede e Service Worker
 * AIDEV-NOTE: Use these helpers for troubleshooting SW and cache issues
 */

/**
 * Verifica o status do Service Worker e remove se necessário
 * AIDEV-TODO: Add more granular SW cleanup if multiple scopes are used
 */
export const checkAndCleanServiceWorker = async () => {
  console.log('🔍 [NetworkDebug] Checking Service Workers...');
  
  if (!('serviceWorker' in navigator)) {
    console.log('✅ [NetworkDebug] Service Worker not supported');
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    if (registrations.length === 0) {
      console.log('✅ [NetworkDebug] No Service Worker registered');
      return;
    }

    console.log(`🔍 [NetworkDebug] Found ${registrations.length} Service Workers:`);
    
    for (const registration of registrations) {
      console.log('📋 [NetworkDebug] Service Worker:', {
        scope: registration.scope,
        updateViaCache: registration.updateViaCache,
        installing: !!registration.installing,
        waiting: !!registration.waiting,
        active: !!registration.active
      });

      // Unregister Service Worker
      // AIDEV-NOTE: Unregistering all found SWs for a clean state
      console.log('🗑️ [NetworkDebug] Unregistering Service Worker:', registration.scope);
      await registration.unregister();
    }

    // Check for active controller
    if (navigator.serviceWorker.controller) {
      console.log('🏁 [NetworkDebug] Service Worker still controlling the page');
      console.log('🔄 [NetworkDebug] Sending skip waiting message...');
      
      navigator.serviceWorker.controller.postMessage({
        type: 'SKIP_WAITING'
      });
    }

    console.log('✅ [NetworkDebug] Service Worker cleanup complete');
    
  } catch (error) {
    console.error('❌ [NetworkDebug] Error cleaning Service Workers:', error); // AIDEV-NOTE: SW cleanup error is non-blocking
  }
};

/**
 * Clears all caches
 * AIDEV-NOTE: Use for hard reset of browser cache during dev
 */
export const clearAllCaches = async () => {
  console.log('🗑️ [NetworkDebug] Limpando todos os caches...');
  
  if (!('caches' in window)) {
    console.log('✅ [NetworkDebug] Cache API não suportada');
    return;
  }

  try {
    const cacheNames = await caches.keys();
    
    if (cacheNames.length === 0) {
      console.log('✅ [NetworkDebug] Nenhum cache encontrado');
      return;
    }

    console.log(`🔍 [NetworkDebug] Encontrados ${cacheNames.length} caches:`, cacheNames);
    
    for (const cacheName of cacheNames) {
      // AIDEV-NOTE: Iterates and deletes all named caches for a clean state
      console.log('🗑️ [NetworkDebug] Removendo cache:', cacheName);
      await caches.delete(cacheName);
    }
    
    console.log('✅ [NetworkDebug] Todos os caches removidos');
    
  } catch (error) {
    console.error('❌ [NetworkDebug] Erro ao limpar caches:', error); // AIDEV-NOTE: Cache cleanup error is non-blocking
  }
};

/**
 * Testa conectividade de rede básica
 * AIDEV-NOTE: Tests multiple endpoints for connectivity and latency
 */
export const testNetworkConnectivity = async () => {
  console.log('🌐 [NetworkDebug] Testando conectividade de rede...');
  
  const testUrls = [
    'https://httpbin.org/json',
    'https://jsonplaceholder.typicode.com/posts/1',
    'https://api.github.com/zen'
  ];

  const results = [];

  for (const url of testUrls) {
    try {
      // AIDEV-NOTE: Measures response time and status for each endpoint
      console.log(`📡 [NetworkDebug] Testando: ${url}`);
      
      const startTime = Date.now();
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'omit'
      });
      const endTime = Date.now();
      
      const result = {
        url,
        success: response.ok,
        status: response.status,
        time: endTime - startTime,
        headers: Object.fromEntries(response.headers.entries())
      };
      
      results.push(result);
      console.log(`✅ [NetworkDebug] ${url}: ${response.status} (${result.time}ms)`);
      
    } catch (error) {
      const result = {
        url,
        success: false,
        error: error.message
      };
      
      results.push(result);
      console.error(`❌ [NetworkDebug] ${url}: ${error.message}`);
    }
  }

  // AIDEV-NOTE: Results array contains connectivity and latency info for diagnostics
  console.log('📊 [NetworkDebug] Resultados dos testes de conectividade:', results);
  return results;
};

/**
 * Força recarregamento completo da página sem cache
 * AIDEV-NOTE: Forces full reload, bypassing cache and SW if possible
 */
export const hardReload = () => {
  console.log('🔄 [NetworkDebug] Forçando recarregamento completo...');
  
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    console.log('🔄 [NetworkDebug] Service Worker ainda ativo, recarregando...');
  }
  
  // Limpar cache do navegador e recarregar
  if ('location' in window) {
    window.location.reload(true);
  }
};

/**
 * Executa diagnóstico completo do ambiente (versão simplificada)
 * AIDEV-NOTE: Collects environment info for troubleshooting
 */
export const runFullDiagnostic = async () => {
  console.log('🩺 [NetworkDebug] Iniciando diagnóstico simplificado...');
  
  const diagnostic = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    online: navigator.onLine,
    serviceWorkerSupport: 'serviceWorker' in navigator,
    cacheSupport: 'caches' in window,
    fetchSupport: 'fetch' in window
  };

  // Verificar Service Workers apenas
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      diagnostic.serviceWorkers = registrations.length;
      console.log(`🔍 [NetworkDebug] Service Workers encontrados: ${registrations.length}`);
    }
  } catch (error) {
    console.error('❌ [NetworkDebug] Erro ao verificar Service Workers:', error);
  }

  console.log('📋 [NetworkDebug] Diagnóstico completo:', diagnostic);
  
  return diagnostic;
};
