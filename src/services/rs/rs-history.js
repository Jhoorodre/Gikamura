// Handler de histórico global para RemoteStorage
import { RS_PATH } from "./rs-config";
import { Model } from "./rs-schemas";

export const createGlobalHistoryHandler = (remoteStorage) => {
  const SORT_KEY = "timestamp";
  const MAX_VALUES = 20;

  let sortObjectByKey = (obj, key) => {
    if (!obj) return [];
    let sortable = [];
    for (let k in obj) {
      sortable.push(obj[k]);
    }
    sortable.sort((f, s) => s[key] - f[key]);
    return sortable;
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
        console.error("[Global History] Sync error, continuing.");
      }
    }
  };

  // Hub methods
  const addHub = (url, title, iconUrl) => remoteStorage[RS_PATH].addHub(url, title, iconUrl);
  const removeHub = (url) => remoteStorage[RS_PATH].removeHub(url);
  const getAllHubs = async () => sortObjectByKey(await remoteStorage[RS_PATH].getAllHubs(), SORT_KEY);

  // Adiciona capítulo lido
  const addChapter = async (slug, source, chapter) => {
    let existingSeries = await remoteStorage[RS_PATH].getSeries(slug, source);
    if (existingSeries) {
      const chapters = [...new Set([...(existingSeries.chapters || []), chapter])];
      return remoteStorage[RS_PATH].editSeries(
        slug, undefined, source, undefined, undefined, undefined, chapters
      );
    } else {
      console.error("[Global History] addChapter - A série não existia.");
    }
  };

  // Obtém capítulos lidos
  const getReadChapters = async (slug, source) => {
    const existingSeries = await remoteStorage[RS_PATH].getSeries(slug, source);
    return existingSeries ? existingSeries.chapters || [] : [];
  };

  // Atualiza a última página lida
  const setLastReadPage = async (slug, source, chapterKey, page) => {
    let existingSeries = await remoteStorage[RS_PATH].getSeries(slug, source);
    if (existingSeries) {
      const lastRead = { chapterKey, page };
      return remoteStorage[RS_PATH].editSeries(
        slug, undefined, source, undefined, undefined, undefined, undefined, lastRead
      );
    }
  };

  // Obtém a última página lida
  const getLastReadPage = async (slug, source) => {
    const existingSeries = await remoteStorage[RS_PATH].getSeries(slug, source);
    return existingSeries ? existingSeries.lastRead : null;
  };

  // Ajuste: editSeries precisa aceitar lastRead
  const editSeries = async (
    slug,
    coverUrl,
    source,
    url,
    title,
    pinned,
    chapters,
    lastRead
  ) => {
    let obj = await remoteStorage[RS_PATH].getSeries(slug, source);
    if (obj) {
      let toStore = Model.builder().exports.seriesBuilder(
        slug || obj.slug,
        coverUrl || obj.coverUrl,
        source || obj.source,
        url || obj.url,
        title || obj.title,
        pinned !== undefined ? pinned : obj.pinned,
        chapters || obj.chapters,
        lastRead !== undefined ? lastRead : obj.lastRead
      );
      return remoteStorage[RS_PATH].storeObject(
        Model.builder().exports.SERIES_META,
        Model.builder().exports.pathBuilder(Model.builder().exports.SERIES_META_PATH, slug, source),
        toStore
      );
    } else {
      console.error("[Remote Storage] Cannot edit a non-existent series.");
    }
  };

  return {
    // Series methods
    max: MAX_VALUES,
    addChapter,
    getReadChapters,
    setLastReadPage,
    getLastReadPage,
    editSeries,
    // Hub methods
    addHub,
    removeHub,
    getAllHubs,
  };
};
