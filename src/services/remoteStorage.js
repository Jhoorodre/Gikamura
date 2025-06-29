const RS_PATH = "Gika";

const remoteStorage = (() => {
  const Model = {
    name: RS_PATH,
    builder: (privateClient) => {
      // ... (código existente de SERIES_META)

      const HUB_META = "hub";
      const HUB_REPLACEMENT_STR = "{HUB_URL_REPLACEMENT}";
      const HUB_META_PATH_BASE = "hubs/";
      const HUB_META_PATH = `${HUB_META_PATH_BASE}${HUB_REPLACEMENT_STR}`;

      privateClient.declareType(HUB_META, {
        type: "object",
        properties: {
          url: { type: "string" },
          title: { type: "string" },
          iconUrl: { type: "string" }, // -> CORRIGIDO: Adicionado campo para o ícone
          timestamp: { type: "number" },
        },
        required: ["url", "title", "timestamp"], // iconUrl não é estritamente necessário
      });

      // -> CORRIGIDO: O construtor agora aceita 'iconUrl'
      let hubPathBuilder = (path, hubUrl) => path.replace(HUB_REPLACEMENT_STR, btoa(hubUrl));
      let hubBuilder = (url, title, iconUrl) => ({ url, title, iconUrl, timestamp: Date.now() });

      return {
        exports: {
          // -> CORRIGIDO: A função 'addHub' agora aceita e guarda o 'iconUrl'
          addHub: (url, title, iconUrl) => privateClient.storeObject(HUB_META, hubPathBuilder(HUB_META_PATH, url), hubBuilder(url, title, iconUrl)),
          removeHub: (url) => privateClient.remove(hubPathBuilder(HUB_META_PATH, url)),
          getAllHubs: () => privateClient.getAll(HUB_META_PATH_BASE),
        },
      };
    },
  };

  let rs = new RemoteStorage({
    cache: true,
    modules: [Model],
  });

  rs.access.claim(RS_PATH, "rw");
  rs.caching.enable(`/${RS_PATH}/`);

  return rs;
})();

const globalHistoryHandler = (() => {
  const SORT_KEY = "timestamp";

  let sortObjectByKey = (obj, key) => {
    return obj ? Object.values(obj).sort((a, b) => b[key] - a[key]) : [];
  };

  // -> CORRIGIDO: A função 'addHub' agora passa o 'iconUrl'
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
