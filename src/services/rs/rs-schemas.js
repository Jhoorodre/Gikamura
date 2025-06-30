import { RS_PATH } from "./rs-config.js";

export const Model = {
  name: RS_PATH,
  builder: (privateClient) => {
    // MODIFICADO: O tipo agora representa apenas o progresso da série
    privateClient.declareType("series-progress", {
      type: "object",
      properties: {
        slug: { type: "string" },
        source: { type: "string" },
        readChapterKeys: { type: "array", default: [] },
        lastRead: {
          type: "object",
          properties: {
            chapterKey: { type: "string" },
            page: { type: "number" },
          },
        },
        timestamp: { type: "number" },
      },
      required: ["slug", "source"],
    });

    const HUB_PATH = "hubs/";
    const SERIES_PROGRESS_PATH = "series-progress/"; // Novo caminho para os dados

    // --- Métodos de Hub permanecem os mesmos ---
    const addHub = (url, title, iconUrl) => {
      const hubId = btoa(url);
      return privateClient.storeObject("hub", `${HUB_PATH}${hubId}`, { url, title, iconUrl, timestamp: Date.now() });
    };
    const removeHub = (url) => privateClient.remove(`${HUB_PATH}${btoa(url)}`);
    const getAllHubs = async () => {
        const listing = await privateClient.getListing(HUB_PATH);
        if (!listing) return [];
        const hubs = await Promise.all(Object.keys(listing).map(hubId => privateClient.getObject(`${HUB_PATH}${hubId}`)));
        return hubs.filter(hub => hub).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    };
    // --- Fim dos Métodos de Hub ---

    // MODIFICADO: Métodos agora focados apenas em progresso
    // Cria uma chave limpa e segura para usar como nome de ficheiro
    const getProgressKey = (slug, source) => {
        const cleanSource = source.replace(/[^a-zA-Z0-9-]/g, '-');
        const cleanSlug = slug.replace(/[^a-zA-Z0-9-]/g, '-');
        return `${cleanSource}-${cleanSlug}`;
    };

    const getSeriesProgress = (slug, source) => {
      const progressKey = getProgressKey(slug, source);
      return privateClient.getObject(`${SERIES_PROGRESS_PATH}${progressKey}`);
    };

    const saveSeriesProgress = async (slug, source, data) => {
        const progressKey = getProgressKey(slug, source);
        let progress = await getSeriesProgress(slug, source).catch(() => null);
        if (!progress) {
            progress = { slug, source, readChapterKeys: [], lastRead: null };
        }
        Object.assign(progress, data, { timestamp: Date.now() });
        return privateClient.storeObject("series-progress", `${SERIES_PROGRESS_PATH}${progressKey}`, progress);
    };
    
    const setLastReadPage = async (slug, source, chapterKey, page) => {
        // Garante que 'progress' seja um objeto, mesmo que a busca falhe
        const progress = await getSeriesProgress(slug, source).catch(() => ({}));
        // Garante que 'readChapterKeys' seja um array
        const readKeys = new Set(progress.readChapterKeys || []);
        readKeys.add(chapterKey);
        const newProgress = {
            lastRead: { chapterKey, page },
            readChapterKeys: [...readKeys]
        };
        return saveSeriesProgress(slug, source, newProgress);
    };

    return {
      exports: {
        addHub,
        removeHub,
        getAllHubs,
        getSeriesProgress,
        setLastReadPage,
      },
    };
  },
};