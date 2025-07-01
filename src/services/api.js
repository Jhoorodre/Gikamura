import { remoteStorage } from "./remotestorage.js";
import { RS_PATH } from "./rs/rs-config.js";

const MAX_HISTORY_ITEMS = 20;
const SORT_KEY = "timestamp";

/**
 * Helper para ordenar um objeto de objetos por uma chave interna.
 * @returns {Array} Array ordenado.
 */
const getSortedArray = (obj) => {
  if (!obj) return [];
  return Object.values(obj).sort((a, b) => (b[SORT_KEY] || 0) - (a[SORT_KEY] || 0));
};

let syncExecuted = false;

/**
 * Garante que o cache local não tenha objetos inválidos.
 */
const sync = async () => {
  if (syncExecuted) return;
  const rs = remoteStorage[RS_PATH];
  if (!rs) return;

  const allSeries = await rs.getAllSeries();
  if (!allSeries) return;

  for (const item of Object.values(allSeries)) {
    if (!item || !item[SORT_KEY]) {
      console.warn(`[API Sync] Removendo série inválida: ${item?.slug}`);
      await rs.removeSeries(item?.slug, item?.source);
    }
  }
  syncExecuted = true;
};

const api = {
  // --- Métodos de Séries ---
  maxHistory: MAX_HISTORY_ITEMS,

  async pushSeries(slug, coverUrl, source, url, title) {
    const rs = remoteStorage[RS_PATH];
    const allSeries = getSortedArray(await rs.getAllSeries());
    const existingSeries = allSeries.find(e => e.slug === slug && e.source === source);

    if (existingSeries) {
      // Apenas atualiza o timestamp para movê-la para o topo do histórico
      return rs.editSeries(slug, source, { title, url, coverUrl });
    }

    // Se não existe, adiciona e gerencia o limite do histórico
    const unpinnedSeries = allSeries.filter(e => !e.pinned);
    if (unpinnedSeries.length >= MAX_HISTORY_ITEMS) {
      const oldest = unpinnedSeries[unpinnedSeries.length - 1];
      await rs.removeSeries(oldest.slug, oldest.source);
    }
    return rs.addSeries(slug, coverUrl, source, url, title, false, []);
  },

  removeSeries: (slug, source) => remoteStorage[RS_PATH]?.removeSeries(slug, source),

  async removeAllUnpinnedSeries() {
    const series = await this.getAllUnpinnedSeries();
    const promises = series.map(s => this.removeSeries(s.slug, s.source));
    await Promise.all(promises);
  },

  addChapter: (slug, source, chapter) => api.addChapters(slug, source, [chapter]),

  async addChapters(slug, source, chapters) {
    const rs = remoteStorage[RS_PATH];
    const series = await rs.getSeries(slug, source);
    if (series) {
      const updatedChapters = [...new Set([...(series.chapters || []), ...chapters])];
      return rs.editSeries(slug, source, { chapters: updatedChapters });
    }
  },

  async removeChapter(slug, source, chapter) {
    const rs = remoteStorage[RS_PATH];
    const series = await rs.getSeries(slug, source);
    if (series?.chapters) {
      const updatedChapters = series.chapters.filter(c => c !== chapter);
      return rs.editSeries(slug, source, { chapters: updatedChapters });
    }
  },

  removeAllChapters: (slug, source) => remoteStorage[RS_PATH]?.editSeries(slug, source, { chapters: [] }),

  async getReadChapters(slug, source) {
    const series = await remoteStorage[RS_PATH]?.getSeries(slug, source);
    return series?.chapters || [];
  },

  async isSeriesPinned(slug, source) {
    const series = await remoteStorage[RS_PATH]?.getSeries(slug, source);
    return !!series?.pinned;
  },

  async pinSeries(slug, source) {
    const series = await remoteStorage[RS_PATH]?.getSeries(slug, source);
    if (series) {
      return remoteStorage[RS_PATH]?.editSeries(slug, source, { pinned: true });
    }
    // Se não existe, cria e já fixa (opcional, mas parece útil)
    // return this.pushSeries(slug, coverUrl, source, url, title).then(() => this.pinSeries(slug, source));
  },

  unpinSeries: (slug, source) => remoteStorage[RS_PATH]?.editSeries(slug, source, { pinned: false }),

  async getAllPinnedSeries() {
    const all = getSortedArray(await remoteStorage[RS_PATH]?.getAllSeries());
    return all.filter(e => e.pinned);
  },

  async getAllUnpinnedSeries() {
    const all = getSortedArray(await remoteStorage[RS_PATH]?.getAllSeries());
    return all.filter(e => !e.pinned);
  },

  // --- Métodos de Hubs ---
  addHub: (url, title, iconUrl) => remoteStorage[RS_PATH]?.addHub(url, title, iconUrl),

  removeHub: (url) => remoteStorage[RS_PATH]?.removeHub(url),

  async getAllHubs() {
    return getSortedArray(await remoteStorage[RS_PATH]?.getAllHubs());
  },
};

if (typeof window !== 'undefined') {
  window.gikaApi = api; // Expondo a nova API para depuração
}

// Executa sync uma vez ao carregar a aplicação
sync();

export default api;