import RemoteStorage from "remotestoragejs";
import { RS_PATH } from "./rs/rs-config.js";
import { Model as CustomModule } from "./rs/rs-schemas.js";

// 1. Cria a instância do RemoteStorage
const remoteStorage = new RemoteStorage({
  cache: true,
  // Carrega nosso módulo personalizado
  modules: [CustomModule],
});

// 2. Requisita acesso ao módulo "Gika" (ou o nome que estiver no config)
// com permissão de leitura e escrita (rw)
remoteStorage.access.claim(RS_PATH, "rw");

// 3. Habilita o cache para nosso módulo
remoteStorage.caching.enable(`/${RS_PATH}/`);

// 4. Disponibiliza no escopo global para o Widget e para depuração
if (typeof window !== 'undefined') {
  window.remoteStorage = remoteStorage;
}

// 5. Exporta a instância pronta para ser usada na aplicação
export { remoteStorage };