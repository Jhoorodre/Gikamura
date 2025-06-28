const RS_PATH = "Gika";

const remoteStorage = (() => {
  const Model = {
    name: RS_PATH,
    builder: (privateClient) => {
      const SERIES_META = "series";
      const SERIES_REPLACEMENT_STR = "{SOURCE_SLUG_REPLACEMENT}";
      const SERIES_META_PATH_BASE = "series/";
      const SERIES_META_PATH = `${SERIES_META_PATH_BASE}${SERIES_REPLACEMENT_STR}`;

      privateClient.declareType(SERIES_META, {
        type: "object",
        properties: {
          slug: { type: "string" },
          coverUrl: { type: "string" },
          source: { type: "string" },
          url: { type: "string" },
          title: { type: "string" },
          timestamp: { type: "number" },
          chapters: { type: "array", default: [] },
          pinned: { type: "boolean", default: false },
        },
        required: ["slug", "source", "url", "title", "timestamp", "chapters", "pinned"],
      });

      const HUB_META = "hub";
      const HUB_REPLACEMENT_STR = "{HUB_URL_REPLACEMENT}";
      const HUB_META_PATH_BASE = "hubs/";
      const HUB_META_PATH = `${HUB_META_PATH_BASE}${HUB_REPLACEMENT_STR}`;

      privateClient.declareType(HUB_META, {
        type: "object",
        properties: {
          url: { type: "string" },
          title: { type: "string" },
          iconUrl: { type: "string" },
          timestamp: { type: "number" },
        },
        required: ["url", "title", "timestamp"],
      });

      let hubPathBuilder = (path, hubUrl) => path.replace(HUB_REPLACEMENT_STR, btoa(hubUrl));
      let hubBuilder = (url, title, iconUrl) => ({ url, title, iconUrl, timestamp: Date.now() });

      return {
        exports: {
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
