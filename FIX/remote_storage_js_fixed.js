import RemoteStorage from "remotestoragejs";
import Widget from "remotestorage-widget";

const RS_PATH = "cubari";

// 1. Inicializa a lógica do RemoteStorage
const remoteStorage = new RemoteStorage({
  cache: true, // Ativa o cache para uso offline
});

// 2. Requisita permissão para ler e escrever na pasta 'hub-data'
remoteStorage.access.claim("hub-data", "rw");

// 3. Ativa o cache para essa pasta
remoteStorage.caching.enable("/hub-data/");

// 4. Inicializa o Widget NATIVO
const widget = new Widget(remoteStorage, {
  // Configurações para forçar o posicionamento
  autoCloseAfter: 0, // Não fecha automaticamente
  modalBackdrop: false, // Remove o backdrop
});

// 5. Função para anexar o widget corretamente
const attachWidget = () => {
  if (typeof document !== "undefined") {
    const container = document.getElementById('remotestorage-widget-container');
    if (container) {
      // Limpa qualquer conteúdo anterior
      container.innerHTML = '';
      
      // Anexa o widget
      widget.attach('remotestorage-widget-container');
      
      // Força o posicionamento após anexar
      setTimeout(() => {
        const widgetElement = container.querySelector('.rs-widget');
        if (widgetElement) {
          // Remove qualquer estilo inline que possa estar centralizando
          widgetElement.style.position = 'relative';
          widgetElement.style.top = 'auto';
          widgetElement.style.left = 'auto';
          widgetElement.style.right = 'auto';
          widgetElement.style.bottom = 'auto';
          widgetElement.style.transform = 'none';
          widgetElement.style.margin = '0';
        }
      }, 100);
    }
  }
};

// 6. Função para toggle do widget
const toggleWidget = () => {
  if (widget && typeof widget.toggle === 'function') {
    widget.toggle();
  }
};

// 7. Exporta as funções e instâncias
export { widget, remoteStorage, attachWidget, toggleWidget };

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