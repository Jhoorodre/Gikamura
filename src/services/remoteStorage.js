import RemoteStorage from "remotestoragejs";
import Widget from "remotestorage-widget";

const RS_PATH = "cubari";

// 1. Inicializa a lógica do RemoteStorage
const remoteStorage = new RemoteStorage({
  cache: true,
});

// 2. Requisita permissão de escrita/leitura
remoteStorage.access.claim("hub-data", "rw");

// 3. Ativa o cache para a pasta
remoteStorage.caching.enable("/hub-data/");

// 4. Inicializa o Widget nativo
const widget = new Widget(remoteStorage);

// 5. Função para ATIVAR o widget (não mais para anexar)
const connect = () => {
    if (widget && typeof widget.toggle === 'function') {
        widget.toggle();
    }
};

export { remoteStorage, widget, connect };

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
