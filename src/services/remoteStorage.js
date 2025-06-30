// src/services/remoteStorage.js
import RemoteStorage from "remotestoragejs";
import { RS_PATH } from "./rs/rs-config.js";
import { Model as CustomModule } from "./rs/rs-schemas.js";

// 1. Cria a instância do RemoteStorage
const remoteStorage = new RemoteStorage({
  cache: true,
  modules: [CustomModule], // Carrega nosso módulo personalizado
});

// 2. Requisita acesso ao módulo "Gika" com permissão de leitura/escrita
remoteStorage.access.claim(RS_PATH, "rw");

// 3. Habilita o cache para nosso módulo
remoteStorage.caching.enable(`/${RS_PATH}/`);

// 4. Disponibiliza no escopo global para o Widget e para depuração
if (typeof window !== 'undefined') {
  window.remoteStorage = remoteStorage;
}

// ... exporta a instância
export { remoteStorage };