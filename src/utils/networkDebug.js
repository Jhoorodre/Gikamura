/**
 * Utilitários para debug de rede e Service Worker
 */

/**
 * Verifica o status do Service Worker e remove se necessário
 */
export const checkAndCleanServiceWorker = async () => {
  console.log('🔍 [NetworkDebug] Verificando Service Workers...');
  
  if (!('serviceWorker' in navigator)) {
    console.log('✅ [NetworkDebug] Service Worker não suportado');
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    if (registrations.length === 0) {
      console.log('✅ [NetworkDebug] Nenhum Service Worker registrado');
      return;
    }

    console.log(`🔍 [NetworkDebug] Encontrados ${registrations.length} Service Workers:`);
    
    for (const registration of registrations) {
      console.log('📋 [NetworkDebug] Service Worker:', {
        scope: registration.scope,
        updateViaCache: registration.updateViaCache,
        installing: !!registration.installing,
        waiting: !!registration.waiting,
        active: !!registration.active
      });

      // Desregistrar Service Worker
      console.log('🗑️ [NetworkDebug] Desregistrando Service Worker:', registration.scope);
      await registration.unregister();
    }

    // Verificar se há controlador ativo
    if (navigator.serviceWorker.controller) {
      console.log('🎯 [NetworkDebug] Service Worker ainda controlando a página');
      console.log('🔄 [NetworkDebug] Enviando mensagem para skip waiting...');
      
      navigator.serviceWorker.controller.postMessage({
        type: 'SKIP_WAITING'
      });
    }

    console.log('✅ [NetworkDebug] Limpeza de Service Workers concluída');
    
  } catch (error) {
    console.error('❌ [NetworkDebug] Erro ao limpar Service Workers:', error);
  }
};

/**
 * Limpa todos os caches
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
      console.log('🗑️ [NetworkDebug] Removendo cache:', cacheName);
      await caches.delete(cacheName);
    }
    
    console.log('✅ [NetworkDebug] Todos os caches removidos');
    
  } catch (error) {
    console.error('❌ [NetworkDebug] Erro ao limpar caches:', error);
  }
};

/**
 * Testa conectividade de rede básica
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

  console.log('📊 [NetworkDebug] Resultados dos testes de conectividade:', results);
  return results;
};

/**
 * Força recarregamento completo da página sem cache
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
