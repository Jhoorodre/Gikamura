import RemoteStorage from 'remotestoragejs';
import Widget from 'remotestorage-widget';

// Define o nome do módulo de armazenamento. Pode ser "cubari", "Gika", ou o que preferir.
const RS_PATH = "Gika";

// --- Módulo Customizado para o RemoteStorage ---
const GikaModule = {
  name: RS_PATH,
  builder: (privateClient) => {
    const HUB_META_TYPE = "hub";
    const HUB_META_PATH_BASE = "hubs/";
    
    // Declara o "schema" ou a estrutura de dados para um hub.
    privateClient.declareType(HUB_META_TYPE, {
      type: "object",
      properties: {
        url: { type: "string", required: true },
        title: { type: "string", required: true },
        iconUrl: { type: "string" }, // O URL do ícone é opcional
        timestamp: { type: "number", required: true },
      },
    });

    /**
     * Constrói o caminho único para cada hub guardado.
     * Usa btoa() para codificar a URL e usá-la como um nome de ficheiro seguro.
     * @param {string} hubUrl - A URL do hub.
     * @returns {string} O caminho para o ficheiro do hub.
     */
    const getHubPath = (hubUrl) => `${HUB_META_PATH_BASE}${btoa(hubUrl)}`;

    /**
     * Cria um objeto de hub com os dados necessários.
     * @param {string} url - A URL do hub.
     * @param {string} title - O título do hub.
     * @param {string} iconUrl - O URL do ícone do hub.
     * @returns {object} O objeto de hub.
     */
    const createHubObject = (url, title, iconUrl) => ({
      url,
      title,
      iconUrl,
      timestamp: Date.now(),
    });

    // Expõe as funções que o seu código irá usar.
    return {
      exports: {
        /**
         * Guarda as informações de um hub no armazenamento remoto.
         * @param {string} url - A URL do hub a ser guardada.
         * @param {string} title - O título do hub.
         * @param {string} iconUrl - O URL do ícone do hub.
         */
        addHub: (url, title, iconUrl) =>
          privateClient.storeObject(
            HUB_META_TYPE,
            getHubPath(url),
            createHubObject(url, title, iconUrl)
          ),

        /**
         * Remove um hub do armazenamento remoto.
         * @param {string} url - A URL do hub a ser removido.
         */
        removeHub: (url) => privateClient.remove(getHubPath(url)),

        /**
         * Obtém todos os hubs guardados.
         * @returns {Promise<object>} Uma promessa que resolve para um objeto com todos os hubs.
         */
        getAllHubs: () => privateClient.getAll(HUB_META_PATH_BASE),
      },
    };
  },
};

// --- Inicialização do RemoteStorage ---
export const remoteStorage = new RemoteStorage({
  cache: true,
  modules: [GikaModule], // Adiciona o seu módulo customizado
});

// Reivindica acesso de leitura e escrita para o seu módulo
remoteStorage.access.claim(RS_PATH, "rw");

// Ativa o cache para o seu módulo
remoteStorage.caching.enable(`/${RS_PATH}/`);

// --- Inicialização do Widget ---
export const widget = new Widget(remoteStorage);

// --- Funções Auxiliares Exportadas ---

/**
 * Inicia o processo de conexão do widget do RemoteStorage.
 * O widget irá tratar da interface de utilizador para a autenticação.
 */
export const connect = () => {
  widget.connect();
};

/**
 * Alterna a visibilidade do widget.
 */
export const toggleWidget = () => {
    widget.toggle();
};


// --- Handler Global (Opcional, mas mantém a consistência com o seu código) ---
// Este handler facilita o acesso às funções do módulo.
const globalHistoryHandler = {
  /**
   * Adiciona um hub ao histórico.
   * @param {string} url - A URL do hub.
   * @param {string} title - O título do hub.
   * @param {string} iconUrl - O URL do ícone do hub.
   */
  addHub: (url, title, iconUrl) => remoteStorage[RS_PATH].addHub(url, title, iconUrl),
  
  /**
   * Remove um hub do histórico.
   * @param {string} url - A URL do hub.
   */
  removeHub: (url) => remoteStorage[RS_PATH].removeHub(url),

  /**
   * Obtém todos os hubs guardados e ordena-os por data (mais recente primeiro).
   * @returns {Promise<Array<object>>} Uma promessa que resolve para uma lista de hubs.
   */
  getAllHubs: async () => {
    const hubs = await remoteStorage[RS_PATH].getAllHubs();
    // Verifica se hubs é um objeto antes de tentar ordenar
    return hubs ? Object.values(hubs).sort((a, b) => b.timestamp - a.timestamp) : [];
  },
};

// Disponibiliza as instâncias globalmente para fácil acesso em toda a aplicação,
// especialmente para scripts que não são módulos ES6.
window.remoteStorage = remoteStorage;
window.globalHistoryHandler = globalHistoryHandler;
window.Widget = Widget; // Garante que a classe Widget esteja disponível globalmente

// Inicializa e anexa o widget quando o remoteStorage estiver pronto
remoteStorage.on('ready', () => {
  console.log('RemoteStorage is ready. Attaching widget.'); // Add console log
  const widget = new Widget(remoteStorage);
  widget.attach(); // Anexa globalmente, como no HTML
});
