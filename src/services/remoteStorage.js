import RemoteStorage from "remotestoragejs";
import { RS_PATH } from "./rs/rs-config.js";
import { Model as CustomModule } from "./rs/rs-schemas.js";

const remoteStorage = new RemoteStorage({
  cache: true,
  modules: [CustomModule],
  // Descoberta genial sua! Previne que falhas no IndexedDB causem lentidão
  // na inicialização, um problema comum e pouco documentado.
  disableFeatures: ["IndexedDB"],
});

remoteStorage.access.claim(RS_PATH.BASE, "rw");
remoteStorage.caching.enable(`/${RS_PATH.BASE}/`);

/**
 * Limpa o cache local de entradas órfãs ou corrompidas.
 * Útil para resolver estados inconsistentes.
 */
const purgePreviousCache = () => {
  remoteStorage.caching.reset();
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("remotestorage:") && localStorage.getItem(key) === "undefined") {
      localStorage.removeItem(key);
    }
  }
};

/**
 * Função utilitária para forçar sincronização através de operação nos dados
 * O RemoteStorage.js sincroniza automaticamente quando dados são alterados
 */
const forceSyncByDataOperation = async () => {
  try {
    // Verifica se está conectado
    if (!remoteStorage.connected) {
      console.warn('⚠️ RemoteStorage não conectado para sync');
      return false;
    }

    // Tenta acessar o módulo customizado
    const customModule = remoteStorage.custom;
    if (customModule && typeof customModule.storeObject === 'function') {
      // Cria um objeto pequeno para forçar sincronização
      const timestamp = new Date().toISOString();
      const syncData = {
        lastSync: timestamp,
        type: 'sync-trigger'
      };
      
      // Armazena o objeto (isso força sincronização)
      await customModule.storeObject('json', 'sync-trigger.json', syncData);
      console.log('🔄 Sync forçado através de storeObject');
      return true;
    } 
    
    // Fallback: tenta método mais simples
    if (customModule && typeof customModule.storeFile === 'function') {
      const timestamp = new Date().getTime();
      await customModule.storeFile('text', 'sync-trigger.txt', timestamp.toString());
      console.log('🔄 Sync forçado através de storeFile');
      return true;
    }

    console.warn('⚠️ Módulo custom não disponível para forçar sync');
    return false;
  } catch (error) {
    console.warn('❌ Erro ao forçar sync por dados:', error);
    return false;
  }
};

// Garantir que o RemoteStorage esteja disponível globalmente
if (typeof window !== 'undefined') {
  window.remoteStorage = remoteStorage;
  
  // Log de debug para verificar se está funcionando
  console.log('RemoteStorage inicializado:', {
    connected: remoteStorage.connected,
    access: remoteStorage.access.scopes,
    backend: remoteStorage.backend
  });

  // ⚠️ REMOVIDO: Event listeners movidos para RemoteStorageContext.jsx
  // para evitar duplicação e ter melhor controle
  
  // Event listener para conectado (apenas informativo)
  if (!remoteStorage._basicListenersAdded) {
    remoteStorage.on('connected', () => {
      console.log('✅ RemoteStorage conectado!');
      console.log('Backend:', remoteStorage.backend);
      console.log('🔄 RemoteStorage sincroniza automaticamente quando dados mudam');
      console.log('📡 Para forçar sync, use o botão na interface ou modifique dados');
    });
    
    remoteStorage._basicListenersAdded = true;
  }
}

export { remoteStorage, purgePreviousCache, forceSyncByDataOperation };