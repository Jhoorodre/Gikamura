// AIDEV-NOTE: RemoteStorage initialization with custom modules and cache management
import RemoteStorage from "remotestoragejs";
import { RS_PATH } from "./rs/rs-config.js";
import { Model as CustomModule } from "./rs/rs-schemas.js";

/**
 * Inicializa o RemoteStorage com módulos customizados
 * AIDEV-NOTE: Sets up RemoteStorage with custom modules and disables IndexedDB for performance
 */
const remoteStorage = new RemoteStorage({
  cache: true,
  modules: [CustomModule],
  // AIDEV-NOTE: Prevents IndexedDB failures from causing startup slowdown (common undocumented issue)
  disableFeatures: ["IndexedDB"],
});

remoteStorage.access.claim(RS_PATH.BASE, "rw");
remoteStorage.caching.enable(`/${RS_PATH.BASE}/`);

/**
 * AIDEV-NOTE: Clears local cache of orphaned or corrupted entries for inconsistent states
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
 * AIDEV-NOTE: Forces sync through data operation since RemoteStorage auto-syncs on data changes
 */
const forceSyncByDataOperation = async () => {
  try {
    // AIDEV-NOTE: Check if connected before attempting sync
    if (!remoteStorage.connected) {
      console.warn('⚠️ RemoteStorage não conectado para sync');
      return false;
    }

    // AIDEV-NOTE: Try to access custom module for sync trigger
    const customModule = remoteStorage.custom;
    if (customModule && typeof customModule.storeObject === 'function') {
      // AIDEV-NOTE: Create small object to force synchronization
      const timestamp = new Date().toISOString();
      const syncData = {
        lastSync: timestamp,
        type: 'sync-trigger'
      };
      
      // AIDEV-NOTE: Store object (this forces sync)
      await customModule.storeObject('json', 'sync-trigger.json', syncData);
      console.log('🔄 Sync forçado através de storeObject');
      return true;
    } 
    
    // AIDEV-NOTE: Fallback to simpler method if storeObject unavailable
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

// AIDEV-NOTE: Make RemoteStorage globally available with debug info
if (typeof window !== 'undefined') {
  window.remoteStorage = remoteStorage;
  
  // AIDEV-NOTE: Debug log to verify initialization
  console.log('RemoteStorage inicializado:', {
    connected: remoteStorage.connected,
    access: remoteStorage.access.scopes,
    backend: remoteStorage.backend
  });

  // AIDEV-NOTE: Event listeners moved to RemoteStorageContext.jsx to avoid duplication
  
  // AIDEV-NOTE: Basic connection listener for informational purposes only
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