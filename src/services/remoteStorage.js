import RemoteStorage from "remotestoragejs";
import Widget from "remotestorage-widget"; // Incluindo o Widget novamente

const RS_PATH = "cubari";

// 1. Inicializa a lógica do RemoteStorage
const remoteStorage = new RemoteStorage({
  cache: true, // Ativa o cache para uso offline
});

// 2. Requisita permissão para ler e escrever na pasta 'hub-data'
remoteStorage.access.claim("hub-data", "rw");

// 3. Ativa o cache para essa pasta
remoteStorage.caching.enable("/hub-data/");

// 4. Inicializa o Widget NATIVO, que cuidará da interface
const widget = new Widget(remoteStorage); // Instanciando o Widget novamente

// 5. Anexa o widget ao DOM. Ele ficará oculto até ser chamado.
if (typeof document !== "undefined") {
    // REMOVIDO: widget.attach('remotestorage-widget-container'); // Anexando ao contêiner
}

// 6. Exporta a instância do widget e remoteStorage para ser usada em outros componentes
export { widget, remoteStorage }; // Exportando o widget novamente

const globalHistoryHandler = (() => {
  const SORT_KEY = "timestamp";

  let sortObjectByKey = (obj, key) => {
    return obj ? Object.values(obj).sort((a, b) => b[key] - a[key]) : [];
  };

  const addHub = (url, title, iconUrl) => remoteStorage[RS_PATH].addHub(url, title, iconUrl);
  const removeHub = (url) => remoteStorage[RS_PATH].removeHub(url);
  const getAllHubs = async () => sortObjectByKey(await remoteStorage[RS_PATH].getAllHubs(), SORT_KEY);

  return {
    addHub,
    removeHub,
    getAllHubs,
  };
})();

window.remoteStorage = remoteStorage;
window.globalHistoryHandler = globalHistoryHandler;
