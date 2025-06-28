// Builders para caminhos e objetos
const SERIES_META = "series";
const REPLACEMENT_STR = "{SOURCE_SLUG_REPLACEMENT}";
const SERIES_META_PATH_BASE = "series/";
const SERIES_META_PATH = `${SERIES_META_PATH_BASE}${REPLACEMENT_STR}`;

const HUB_META = "hub";
const HUB_REPLACEMENT_STR = "{HUB_URL_REPLACEMENT}";
const HUB_META_PATH_BASE = "hubs/";
const HUB_META_PATH = `${HUB_META_PATH_BASE}${HUB_REPLACEMENT_STR}`;

const slugBuilder = (slug, source) => `${source}-${slug}`;
const pathBuilder = (path, slug, source) => path.replace(REPLACEMENT_STR, slugBuilder(slug, source));
const seriesBuilder = (slug, coverUrl, source, url, title, pinned, chapters) => ({
    slug,
    coverUrl: coverUrl || "",
    source,
    url,
    title,
    timestamp: Date.now(),
    chapters: chapters || [],
    pinned: pinned === undefined ? false : pinned,
});

const hubPathBuilder = (path, hubUrl) => path.replace(HUB_REPLACEMENT_STR, btoa(hubUrl));
const hubBuilder = (url, title, iconUrl) => ({ url, title, iconUrl, timestamp: Date.now() });

// Funções exportadas
export const createStorageAPI = (privateClient) => ({
    // --- Funções de Série ---
    addSeries: (slug, coverUrl, source, url, title, pinned, chapters) => {
        const toStore = seriesBuilder(slug, coverUrl, source, url, title, pinned, chapters);
        return privateClient.storeObject(SERIES_META, pathBuilder(SERIES_META_PATH, slug, source), toStore);
    },
    editSeries: async (slug, coverUrl, source, url, title, pinned, chapters) => {
        const obj = await privateClient.getObject(pathBuilder(SERIES_META_PATH, slug, source));
        if (obj) {
            const toStore = seriesBuilder(
                slug || obj.slug,
                coverUrl || obj.coverUrl,
                source || obj.source,
                url || obj.url,
                title || obj.title,
                pinned !== undefined ? pinned : obj.pinned,
                chapters || obj.chapters
            );
            return privateClient.storeObject(SERIES_META, pathBuilder(SERIES_META_PATH, slug, source), toStore);
        } else {
            console.error("[Storage API] Não é possível editar uma série que não existe.");
        }
    },
    getSeries: (slug, source) => privateClient.getObject(pathBuilder(SERIES_META_PATH, slug, source), false),
    removeSeries: (slug, source) => privateClient.remove(pathBuilder(SERIES_META_PATH, slug, source)),
    getAllSeries: () => {
        const cacheTime = privateClient.storage.connected ? 60000 : undefined;
        return privateClient.getAll(SERIES_META_PATH_BASE, cacheTime);
    },

    // --- Funções de Hub ---
    addHub: (url, title, iconUrl) => privateClient.storeObject(HUB_META, hubPathBuilder(HUB_META_PATH, url), hubBuilder(url, title, iconUrl)),
    removeHub: (url) => privateClient.remove(hubPathBuilder(HUB_META_PATH, url)),
    getAllHubs: () => privateClient.getAll(HUB_META_PATH_BASE),
});
