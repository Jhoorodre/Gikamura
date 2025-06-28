import React, { createContext, useContext, useState } from 'react';
import RemoteStorage from 'remotestoragejs';

// --- LÓGICA DE ARMAZENAMENTO UNIFICADA ---

const RS_PATH = "Gika";

const remoteStorage = (() => {
  const Model = {
    name: RS_PATH,
    builder: (privateClient) => {
      const SERIES_META = "series";
      const REPLACEMENT_STR = "{SOURCE_SLUG_REPLACEMENT}";
      const SERIES_META_PATH_BASE = "series/";
      const SERIES_META_PATH = `${SERIES_META_PATH_BASE}${REPLACEMENT_STR}`;

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
        required: [ "slug", "source", "url", "title", "timestamp", "chapters", "pinned" ],
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

      let slugBuilder = (slug, source) => `${source}-${slug}`;
      let pathBuilder = (path, slug, source) => path.replace(REPLACEMENT_STR, slugBuilder(slug, source));
      let seriesBuilder = (slug, coverUrl, source, url, title, pinned, chapters) => ({
          slug: slug,
          coverUrl: coverUrl || "",
          source: source,
          url: url,
          title: title,
          timestamp: Date.now(),
          chapters: chapters || [],
          pinned: pinned === undefined ? false : pinned,
      });

      let hubPathBuilder = (path, hubUrl) => path.replace(HUB_REPLACEMENT_STR, btoa(hubUrl));
      let hubBuilder = (url, title, iconUrl) => ({ url, title, iconUrl, timestamp: Date.now() });

      return {
        exports: {
          slugBuilder,
          addSeries: (slug, coverUrl, source, url, title, pinned, chapters) => {
            let toStore = seriesBuilder(slug, coverUrl, source, url, title, pinned, chapters);
            return privateClient.storeObject(SERIES_META, pathBuilder(SERIES_META_PATH, slug, source), toStore);
          },
          editSeries: async (slug, coverUrl, source, url, title, pinned, chapters) => {
            let obj = await privateClient.getObject(pathBuilder(SERIES_META_PATH, slug, source));
            if (obj) {
              let toStore = seriesBuilder(
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
              console.error("[Remote Storage] Não é possível editar uma série que não existe.");
            }
          },
          getSeries: (slug, source) => privateClient.getObject(pathBuilder(SERIES_META_PATH, slug, source), false),
          removeSeries: (slug, source) => privateClient.remove(pathBuilder(SERIES_META_PATH, slug, source)),
          getAllSeries: () => {
            if (privateClient.storage.connected) {
              return privateClient.getAll(SERIES_META_PATH_BASE, 60000);
            } else {
              return privateClient.getAll(SERIES_META_PATH_BASE);
            }
          },
          addHub: (url, title, iconUrl) => privateClient.storeObject(HUB_META, hubPathBuilder(HUB_META_PATH, url), hubBuilder(url, title, iconUrl)),
          removeHub: (url) => privateClient.remove(hubPathBuilder(HUB_META_PATH, url)),
          getAllHubs: () => privateClient.getAll(HUB_META_PATH_BASE),
        },
      };
    },
  };

  const rs = new RemoteStorage({
    cache: true,
    modules: [Model],
    disableFeatures: ["Dropbox", "GoogleDrive", "IndexedDB"],
  });

  rs.access.claim(RS_PATH, "rw");
  rs.caching.enable(`/${RS_PATH}/`);

  return rs;
})();

const HistoryContext = createContext();

export const useHistory = () => useContext(HistoryContext);

export const HistoryProvider = ({ children }) => {
    const SORT_KEY = "timestamp";
    const MAX_VALUES = 20;

    const sortObjectByKey = (obj, key) => {
        return obj ? Object.values(obj).sort((a, b) => b[key] - a[key]) : [];
    };
    
    const sync = async () => {
        let allSeries = await remoteStorage[RS_PATH].getAllSeries();
        for (const [key, value] of Object.entries(allSeries)) {
            try {
                if (!value[SORT_KEY]) {
                    let separatorIndex = key.indexOf("-");
                    let slug = key.slice(separatorIndex + 1);
                    let source = key.slice(0, separatorIndex);
                    await remoteStorage[RS_PATH].removeSeries(slug, source);
                }
            } catch (e) {
                console.error("[Global History] Erro de sincronização, continuando.");
            }
        }
    };

    const pushSeries = async (slug, coverUrl, source, url, title) => {
        await sync();
        let allCurrentSeries = sortObjectByKey((await remoteStorage[RS_PATH].getAllSeries()) || {}, SORT_KEY);
        let existingSeries = allCurrentSeries.find(e => e.slug === slug && e.source === source);
        allCurrentSeries = allCurrentSeries.filter(e => !e.pinned);

        while (allCurrentSeries.length + (existingSeries ? 0 : 1) > MAX_VALUES) {
            let last = allCurrentSeries.pop();
            await remoteStorage[RS_PATH].removeSeries(last.slug, last.source);
        }

        if (existingSeries) {
            return remoteStorage[RS_PATH].editSeries(slug, coverUrl, source, url, title, existingSeries.pinned, existingSeries.chapters);
        } else {
            return remoteStorage[RS_PATH].addSeries(slug, coverUrl, source, url, title, undefined, undefined);
        }
    };

    const removeSeries = (slug, source) => sync().then(() => remoteStorage[RS_PATH].removeSeries(slug, source));

    const removeAllUnpinnedSeries = async () => {
        let series = await getAllUnpinnedSeries();
        if (series) series.forEach(srs => removeSeries(srs.slug, srs.source));
    };

    const addChapters = async (slug, source, chapters) => {
        let existingSeries = await remoteStorage[RS_PATH].getSeries(slug, source);
        if (existingSeries) {
            chapters = [...new Set([...chapters, ...existingSeries.chapters])];
            return remoteStorage[RS_PATH].editSeries(slug, undefined, source, undefined, undefined, undefined, chapters);
        } else {
            console.error("[Global History] addChapters - A série não existe.");
        }
    };

    const addChapter = (slug, source, chapter) => addChapters(slug, source, [chapter]);

    const removeChapter = async (slug, source, chapter) => {
        let existingSeries = await remoteStorage[RS_PATH].getSeries(slug, source);
        if (existingSeries) {
            let chapters = existingSeries.chapters.filter(e => e !== chapter);
            return remoteStorage[RS_PATH].editSeries(slug, undefined, source, undefined, undefined, undefined, chapters);
        } else {
            console.error("[Global History] removeChapter - a série não existe.");
        }
    };

    const removeAllChapters = async (slug, source) => {
        let existingSeries = await remoteStorage[RS_PATH].getSeries(slug, source);
        if (existingSeries) {
            return remoteStorage[RS_PATH].editSeries(slug, undefined, source, undefined, undefined, undefined, []);
        } else {
            console.error("[Global History] removeAllChapters - a série não existe.");
        }
    };

    const getReadChapters = async (slug, source) => {
        let existingSeries = await remoteStorage[RS_PATH].getSeries(slug, source);
        return existingSeries ? existingSeries.chapters : (console.error("[Global History] getReadChapters - a série não existe."), undefined);
    };

    const isSeriesPinned = async (slug, source) => {
        let existingSeries = await remoteStorage[RS_PATH].getSeries(slug, source);
        return !!(existingSeries && existingSeries.pinned);
    };

    const pinSeries = async (slug, coverUrl, source, url, title) => {
        let existingSeries = await remoteStorage[RS_PATH].getSeries(slug, source);
        if (existingSeries) {
            return remoteStorage[RS_PATH].editSeries(slug, undefined, source, undefined, undefined, true, undefined);
        } else {
            return remoteStorage[RS_PATH].addSeries(slug, coverUrl, source, url, title, true, undefined);
        }
    };
    
    const unpinSeries = async (slug, source) => {
        let existingSeries = await remoteStorage[RS_PATH].getSeries(slug, source);
        if (existingSeries) {
            return remoteStorage[RS_PATH].editSeries(slug, undefined, source, undefined, undefined, false, undefined);
        } else {
            console.error("[Global History] unpinSeries - a série não existe.");
        }
    };

    const getAllPinnedSeries = async () => sync().then(() => sortObjectByKey((remoteStorage[RS_PATH].getAllSeries()) || {}, SORT_KEY).filter(e => e.pinned));
    const getAllUnpinnedSeries = async () => sync().then(() => sortObjectByKey((remoteStorage[RS_PATH].getAllSeries()) || {}, SORT_KEY).filter(e => !e.pinned));

    const addHub = (url, title, iconUrl) => remoteStorage[RS_PATH].addHub(url, title, iconUrl);
    const removeHub = (url) => remoteStorage[RS_PATH].removeHub(url);
    const getAllHubs = async () => sortObjectByKey(await remoteStorage[RS_PATH].getAllHubs(), "timestamp");

    const value = {
        remoteStorage,
        max: MAX_VALUES,
        pushSeries,
        removeSeries,
        removeAllUnpinnedSeries,
        addChapters,
        addChapter,
        removeChapter,
        removeAllChapters,
        getReadChapters,
        isSeriesPinned,
        pinSeries,
        unpinSeries,
        getAllPinnedSeries,
        getAllUnpinnedSeries,
        addHub,
        removeHub,
        getAllHubs
    };

    return (
        <HistoryContext.Provider value={value}>
            {children}
        </HistoryContext.Provider>
    );
};
