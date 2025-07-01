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

remoteStorage.access.claim(RS_PATH, "rw");
remoteStorage.caching.enable(`/${RS_PATH}/`);

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

// Garantir que o RemoteStorage esteja disponível globalmente
if (typeof window !== 'undefined') {
  window.remoteStorage = remoteStorage;
  
  // Log de debug para verificar se está funcionando
  console.log('RemoteStorage inicializado:', {
    connected: remoteStorage.connected,
    access: remoteStorage.access.scopes,
    backend: remoteStorage.backend
  });
}

export { remoteStorage, purgePreviousCache };