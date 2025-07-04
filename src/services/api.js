// AIDEV-NOTE: Series CRUD operations, history management, and RemoteStorage sync
import { remoteStorage } from "./remotestorage.js";
import { RS_PATH } from "./rs/rs-config.js";

const MAX_HISTORY_ITEMS = 20;
const SORT_KEY = "timestamp";

/**
 * API de séries, histórico e sincronização
 * AIDEV-NOTE: Handles series CRUD, history and sync with RemoteStorage
 */

/**
 * AIDEV-NOTE: Sorts object values by internal timestamp key
 * @returns {Array} Sorted array by timestamp desc
 */
const getSortedArray = (obj) => {
  if (!obj) return [];
  return Object.values(obj).sort((a, b) => (b[SORT_KEY] || 0) - (a[SORT_KEY] || 0));
};

let syncExecuted = false;

/**
 * AIDEV-NOTE: Ensures local cache doesn't have invalid objects
 */
const sync = async () => {
  if (syncExecuted) return;
  const rs = remoteStorage['Gika'];
  if (!rs) return;

  const allSeries = await rs.getAllSeries();
  if (!allSeries) return;

  // AIDEV-NOTE: Só remove se slug e source existirem para evitar erro undefined-undefined
  for (const item of Object.values(allSeries)) {
    if (!item || !item[SORT_KEY] || !item.slug || !item.source) {
      console.warn(`[API Sync] Removendo série inválida ou incompleta:`, item);
      // Só tenta remover se tiver as chaves necessárias
      if (item?.slug && item?.source) {
        await rs.removeSeries(item.slug, item.source);
      }
    }
  }
  syncExecuted = true;
};

const api = {
  // AIDEV-NOTE: Series methods with history limit management
  maxHistory: MAX_HISTORY_ITEMS,

  // AIDEV-NOTE: Adds or updates series with history limit enforcement
  async pushSeries(slug, coverUrl, source, url, title) {
    console.log('📊 [API] pushSeries called with:', { slug, coverUrl, source, url, title });
    
    const rs = remoteStorage['Gika'];
    const allSeries = getSortedArray(await rs.getAllSeries());
    const existingSeries = allSeries.find(e => e.slug === slug && e.source === source);

    if (existingSeries) {
      // AIDEV-NOTE: Only updates timestamp to move to top of history
      console.log('📊 [API] Updating existing series');
      return rs.editSeries(slug, source, { title, url, coverUrl });
    }

    console.log('📊 [API] Adding new series');
    // AIDEV-NOTE: If doesn't exist, add and manage history limit
    const unpinnedSeries = allSeries.filter(e => !e.pinned);
    if (unpinnedSeries.length >= MAX_HISTORY_ITEMS) {
      const oldest = unpinnedSeries[unpinnedSeries.length - 1];
      await rs.removeSeries(oldest.slug, oldest.source);
    }
    return rs.addSeries(slug, coverUrl, source, url, title, false, []);
  },

  removeSeries: (slug, source) => remoteStorage['Gika']?.removeSeries(slug, source),

  // AIDEV-NOTE: Bulk operations for cleanup
  async removeAllUnpinnedSeries() {
    const series = await this.getAllUnpinnedSeries();
    const promises = series.map(s => this.removeSeries(s.slug, s.source));
    await Promise.all(promises);
  },

  addChapter: (slug, source, chapter) => api.addChapters(slug, source, [chapter]),

  // AIDEV-NOTE: Chapter management with deduplication
  async addChapters(slug, source, chapters) {
    const rs = remoteStorage['Gika'];
    const series = await rs.getSeries(slug, source);
    if (series) {
      const updatedChapters = [...new Set([...(series.chapters || []), ...chapters])];
      return rs.editSeries(slug, source, { chapters: updatedChapters });
    }
  },

  async removeChapter(slug, source, chapter) {
    const rs = remoteStorage['Gika'];
    const series = await rs.getSeries(slug, source);
    if (series?.chapters) {
      const updatedChapters = series.chapters.filter(c => c !== chapter);
      return rs.editSeries(slug, source, { chapters: updatedChapters });
    }
  },

  removeAllChapters: (slug, source) => remoteStorage['Gika']?.editSeries(slug, source, { chapters: [] }),

  async getReadChapters(slug, source) {
    const series = await remoteStorage['Gika']?.getSeries(slug, source);
    return series?.chapters || [];
  },

  /**
   * ✅ CORREÇÃO: Recebe o objeto 'item' completo e guarda todas as
   * informações necessárias, incluindo a 'url' do reader.json.
   */
  async pinSeries(item) {
    console.debug("[api.pinSeries] Chamado com:", item);
    
    const { id, slug, source, url, title, coverUrl } = item;

    if (!source || !slug) {
      console.error("[api.pinSeries] 'source' e 'slug' são obrigatórios.");
      throw new Error("Dados insuficientes para fixar a série.");
    }

    const rs = remoteStorage['Gika'];
    const existingSeries = await rs.getSeries(slug, source);

    if (existingSeries) {
      console.debug("[api.pinSeries] Série já existe, editando para pinned:true");
      const result = await rs.editSeries(slug, source, { pinned: true, timestamp: Date.now() });
      console.debug('[api.pinSeries] Sucesso ao editar série existente:', result);
      return result;
    }
    
    console.debug("[api.pinSeries] Série não existe, criando nova como pinned:true");
    // Constrói o objeto completo para ser guardado
    const seriesData = {
      id,
      slug,
      source,
      url, // URL para o reader.json
      title,
      coverUrl,
      pinned: true,
      timestamp: Date.now(),
      chapters: []
    };

    const result = await rs.storeObject('series', `${source}-${slug}`, seriesData);
    console.debug('[api.pinSeries] Sucesso ao criar nova série:', result);
    return result;
  },

  unpinSeries: (slug, source) => remoteStorage['Gika']?.editSeries(slug, source, { pinned: false }),

  // AIDEV-NOTE: Filtered queries for different views
  async getAllPinnedSeries() {
    const all = getSortedArray(await remoteStorage['Gika']?.getAllSeries());
    return all.filter(e => e.pinned);
  },

  async getAllUnpinnedSeries() {
    const all = getSortedArray(await remoteStorage['Gika']?.getAllSeries());
    return all.filter(e => !e.pinned);
  },

  // AIDEV-NOTE: Hub management methods
  addHub: (url, title, iconUrl) => remoteStorage['Gika']?.addHub(url, title, iconUrl),

  removeHub: (url) => remoteStorage['Gika']?.removeHub(url),

  async getAllHubs() {
    return getSortedArray(await remoteStorage['Gika']?.getAllHubs());
  },
};

if (typeof window !== 'undefined') {
  window.gikaApi = api; // AIDEV-NOTE: Exposed for debugging purposes
}

// AIDEV-NOTE: One-time sync execution on app load
sync();

export default api;