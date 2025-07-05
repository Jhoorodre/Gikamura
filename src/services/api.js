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

/**
 * AIDEV-NOTE: Deduplicate series based on source+slug combination to prevent duplicates
 * @param {Array} series - Array of series objects
 * @returns {Array} Deduplicated array with most recent entries
 */
const deduplicateSeries = (series) => {
  if (!series || !Array.isArray(series)) return [];
  
  const seen = new Map();
  const deduplicated = [];
  
  // Sort by timestamp descending first to keep most recent
  const sorted = series.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  
  for (const item of sorted) {
    if (!item.source || !item.slug || !item.title) {
      console.warn('⚠️ [API] deduplicateSeries: Item sem source, slug ou title encontrado:', item);
      continue;
    }
    
    // AIDEV-NOTE: Cria chave baseada no título normalizado e slug para identificar duplicatas
    // mesmo quando as URLs são diferentes (ex: localhost proxy vs URL original)
    const normalizedTitle = item.title.toLowerCase().trim().replace(/[^\w\s]/g, '');
    const normalizedSlug = item.slug.toLowerCase().trim();
    const key = `${normalizedTitle}|||${normalizedSlug}`;
    
    if (!seen.has(key)) {
      seen.set(key, true);
      deduplicated.push(item);
    } else if (import.meta.env?.DEV) {
      console.warn(`⚠️ [API] deduplicateSeries: Duplicata removida: ${item.title} (${item.slug})`);
    }
  }
  
  if (import.meta.env?.DEV && series.length !== deduplicated.length) {
    console.log(`🧹 [API] deduplicateSeries: ${series.length} -> ${deduplicated.length} (removidas ${series.length - deduplicated.length} duplicatas)`);
  }
  
  return deduplicated;
};

let syncExecuted = false;

/**
 * AIDEV-NOTE: Reset sync flag to allow re-execution on reconnection
 */
const resetSync = () => {
  syncExecuted = false;
  console.log('[API] Sync flag resetado para permitir nova execução');
};

/**
 * AIDEV-NOTE: Ensures local cache doesn't have invalid objects and cleans up corrupted data
 */
const sync = async () => {
  if (syncExecuted) return;
  const rs = remoteStorage['Gika'];
  if (!rs) return;

  try {
    const allSeries = await rs.getAllSeries();
    if (!allSeries) return;

    let hasChanges = false;
    const keysToRemove = [];

    console.log('[API Sync] Iniciando limpeza de dados corrompidos...');

    // AIDEV-NOTE: Remove invalid or corrupted entries from RemoteStorage
    for (const [key, data] of Object.entries(allSeries)) {
      let shouldRemove = false;
      let reason = '';

      // Check for obviously corrupted entries first
      const corruptionReason = isObviouslyCorrupted(key, data);
      if (corruptionReason) {
        shouldRemove = true;
        reason = corruptionReason;
      }
      // For data that should be series, validate against series schema
      else if (!isValidSeries(data)) {
        // Check if it might be a hub mistakenly in series folder
        if (isValidHub(data)) {
          shouldRemove = true;
          reason = 'hub na pasta de séries (estrutura incorreta)';
        } else {
          shouldRemove = true;
          reason = 'série com campos obrigatórios ausentes ou inválidos';
        }
      }

      if (shouldRemove) {
        keysToRemove.push(key);
        console.warn(`[API Sync] ⚠️ Entrada corrompida (${reason}):`, key, 
          typeof data === 'object' ? Object.keys(data).slice(0, 3) : data);
      }
    }

    // Remove invalid entries using the key directly
    for (const key of keysToRemove) {
      try {
        // Use key directly for corrupted entries - they should be removed from RemoteStorage
        if (key.includes('series/') || (!key.includes('hubs/') && !key.includes('/'))) {
          await rs.custom.removeSeriesByKey(key);
        } else if (key.includes('hubs/')) {
          // For hub entries, remove directly
          await rs.custom.removeHub(key.replace('hubs/', ''));
        } else {
          // For other entries, use direct key removal
          const path = key.startsWith('/') ? key.substring(1) : key;
          await rs.custom.remove(path);
        }
        console.log('[API Sync] ✅ Removido:', key);
        hasChanges = true;
      } catch (error) {
        console.error('[API Sync] ❌ Erro ao remover:', key, error);
      }
    }

    if (hasChanges) {
      console.log(`[API Sync] 🧹 Limpeza concluída: ${keysToRemove.length} entradas inválidas removidas`);
    }

    syncExecuted = true;
  } catch (error) {
    console.error('[API Sync] ❌ Erro durante sync/limpeza:', error);
    syncExecuted = true; // Set to true even on error to prevent infinite retries
  }
};

// AIDEV-NOTE: Normaliza URLs de hub para evitar duplicatas (refs/heads/main vs main)
const normalizeHubUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  
  // Converte refs/heads/main para main para evitar duplicatas
  return url.replace('/refs/heads/main/', '/main/')
            .replace('/refs/heads/', '/');
};

// AIDEV-NOTE: Remove dados malformados que podem estar causando problemas
// Validates a series entry according to schema requirements
const isValidSeries = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (Object.keys(value).length === 0) return false;
  
  // Series require: slug, source, url, title, timestamp
  if (!value.title || !value.slug || !value.source || !value.url) return false;
  if (typeof value.title !== 'string' || typeof value.slug !== 'string') return false;
  if (typeof value.source !== 'string' || typeof value.url !== 'string') return false;
  if (value.title.trim() === '' || value.slug.trim() === '') return false;
  
  return true;
};

// Validates a hub entry according to schema requirements
const isValidHub = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (Object.keys(value).length === 0) return false;
  
  // Hubs require: url, title, timestamp
  if (!value.title || !value.url) return false;
  if (typeof value.title !== 'string' || typeof value.url !== 'string') return false;
  if (value.title.trim() === '') return false;
  
  return true;
};

// Generic cleanup for obviously corrupted entries
const isObviouslyCorrupted = (key, value) => {
  // Check for corrupt keys
  if (key.includes('localhost:') || key.includes('127.0.0.1:')) return 'chave com localhost';
  if (key.includes('http://') || key.includes('https://')) return 'chave com URL';
  if (key.includes('{') || key.includes('}')) return 'chave com caracteres especiais';
  if (key.length > 200) return 'chave muito longa (possivelmente base64)';
  
  // Check for corrupt values
  if (typeof value === 'boolean') return 'valor booleano';
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'não é objeto válido';
  if (Object.keys(value).length === 0) return 'objeto vazio';
  if (Object.keys(value).length === 1 && typeof Object.values(value)[0] === 'boolean') return 'apenas um campo booleano';
  if (Object.values(value).every(v => typeof v === 'boolean')) return 'apenas campos booleanos';
  
  return null;
};

// Clean malformed data - now supports both series and hub validation
const cleanMalformedData = (data, type = 'series') => {
  if (!data || typeof data !== 'object') return data;
  
  const cleaned = {};
  let removedCount = 0;
  const isHub = type === 'hub';
  const validator = isHub ? isValidHub : isValidSeries;
  
  for (const [key, value] of Object.entries(data)) {
    let shouldRemove = false;
    let reason = '';
    
    // First check for obvious corruption
    const corruptionReason = isObviouslyCorrupted(key, value);
    if (corruptionReason) {
      shouldRemove = true;
      reason = corruptionReason;
    }
    // Then validate against specific type schema
    else if (!validator(value)) {
      shouldRemove = true;
      reason = `${isHub ? 'hub' : 'série'} com campos obrigatórios ausentes ou inválidos`;
    }
    
    if (shouldRemove) {
      removedCount++;
      if (import.meta.env?.DEV) {
        console.warn(`⚠️ [API] cleanMalformedData (${type}): Removendo entrada malformada (${reason}):`, key, value);
      }
      continue;
    }
    
    cleaned[key] = value;
  }
  
  if (removedCount > 0) {
    console.log(`🧹 [API] cleanMalformedData (${type}): Removidas ${removedCount} entradas corrompidas na memória`);
  }
  
  return cleaned;
};

// AIDEV-NOTE: Função adicional para limpeza manual de dados corrompidos
const cleanCorruptedRemoteStorageData = async () => {
  if (!remoteStorage.connected || !remoteStorage['Gika']) {
    console.log('🔌 [CLEANUP] RemoteStorage não conectado ou módulo não disponível');
    return false;
  }

  try {
    const rs = remoteStorage['Gika'];
    const allSeries = await rs.getAllSeries();
    if (!allSeries) {
      console.log('📭 [CLEANUP] Nenhum dado de séries encontrado');
      return false;
    }

    let cleaned = false;
    const keysToRemove = [];
    let totalEntries = 0;

    console.log('🧹 [CLEANUP] Iniciando limpeza permanente de dados corrompidos...');

    for (const [key, value] of Object.entries(allSeries)) {
      totalEntries++;
      let shouldRemove = false;
      let reason = '';

      // Check for obvious corruption first
      const corruptionReason = isObviouslyCorrupted(key, value);
      if (corruptionReason) {
        shouldRemove = true;
        reason = corruptionReason;
      }
      // Since we're in getAllSeries, validate as series
      else if (!isValidSeries(value)) {
        // Check if it might be a hub mistakenly in series folder
        if (isValidHub(value)) {
          shouldRemove = true;
          reason = 'hub na pasta de séries (estrutura incorreta)';
        } else {
          shouldRemove = true;
          reason = 'série com campos obrigatórios ausentes ou inválidos';
        }
      }

      if (shouldRemove) {
        console.log(`🗑️ [CLEANUP] Marcando para remoção (${reason}):`, key);
        keysToRemove.push(key);
        cleaned = true;
      }
    }

    console.log(`🔍 [CLEANUP] Analisadas ${totalEntries} entradas, ${keysToRemove.length} marcadas para remoção permanente.`);

    // Remove entradas corrompidas permanentemente
    let removedCount = 0;
    for (const key of keysToRemove) {
      try {
        await rs.removeSeriesByKey(key); // Use the proper method
        removedCount++;
        console.log(`✅ [CLEANUP] Removido permanentemente (${removedCount}/${keysToRemove.length}):`, key);
      } catch (error) {
        console.error(`❌ [CLEANUP] Erro ao remover permanentemente:`, key, error);
      }
    }

    if (cleaned && removedCount > 0) {
      console.log(`🎉 [CLEANUP] Limpeza permanente concluída! ${removedCount} entradas removidas do RemoteStorage`);
    } else if (keysToRemove.length > 0 && removedCount === 0) {
      console.warn(`⚠️ [CLEANUP] Tentativa de limpeza sem sucesso. ${keysToRemove.length} entradas detectadas mas não removidas`);
    } else {
      console.log('✨ [CLEANUP] Nenhum dado corrompido encontrado');
    }

    return removedCount > 0;

  } catch (error) {
    console.error('❌ [CLEANUP] Erro na limpeza permanente:', error);
    return false;
  }
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
      // AIDEV-NOTE: Preserve all required fields when updating existing series
      console.log('📊 [API] Updating existing series');
      const updatedData = { 
        title, 
        url, 
        coverUrl,
        timestamp: Date.now(),
        // Preserve required fields from schema
        slug: existingSeries.slug,
        source: existingSeries.source
      };
      return rs.editSeries(slug, source, updatedData);
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
      // AIDEV-NOTE: Preserve all required fields when updating chapters
      const updatedChapters = [...new Set([...(series.chapters || []), ...chapters])];
      const updatedData = { 
        chapters: updatedChapters,
        timestamp: Date.now(),
        // Preserve required fields from schema
        url: series.url,
        title: series.title,
        slug: series.slug,
        source: series.source
      };
      return rs.editSeries(slug, source, updatedData);
    }
  },

  async removeChapter(slug, source, chapter) {
    const rs = remoteStorage['Gika'];
    const series = await rs.getSeries(slug, source);
    if (series?.chapters) {
      // AIDEV-NOTE: Preserve all required fields when removing chapter
      const updatedChapters = series.chapters.filter(c => c !== chapter);
      const updatedData = { 
        chapters: updatedChapters,
        timestamp: Date.now(),
        // Preserve required fields from schema
        url: series.url,
        title: series.title,
        slug: series.slug,
        source: series.source
      };
      return rs.editSeries(slug, source, updatedData);
    }
  },

  async removeAllChapters(slug, source) {
    // AIDEV-NOTE: Get existing series to preserve required fields when clearing chapters
    const rs = remoteStorage['Gika'];
    const series = await rs.getSeries(slug, source);
    
    if (!series) {
      console.warn("[api.removeAllChapters] Série não encontrada:", { slug, source });
      return;
    }
    
    // Preserve all required fields when clearing chapters
    const updatedData = { 
      chapters: [],
      timestamp: Date.now(),
      // Preserve required fields from schema
      url: series.url,
      title: series.title,
      slug: series.slug,
      source: series.source
    };
    
    return rs.editSeries(slug, source, updatedData);
  },

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
      // AIDEV-NOTE: Preserve all required fields when editing existing series
      const updatedData = { 
        pinned: true, 
        timestamp: Date.now(),
        // Preserve required fields from schema
        url: existingSeries.url || url, // Use existing URL or fallback to new one
        title: existingSeries.title || title,
        slug: existingSeries.slug || slug,
        source: existingSeries.source || source
      };
      const result = await rs.editSeries(slug, source, updatedData);
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

  async unpinSeries(slug, source) {
    // AIDEV-NOTE: Get existing series to preserve required fields during unpin
    const rs = remoteStorage['Gika'];
    const existingSeries = await rs.getSeries(slug, source);
    
    if (!existingSeries) {
      console.warn("[api.unpinSeries] Série não encontrada para despinnar:", { slug, source });
      return;
    }
    
    // Preserve all required fields when updating
    const updatedData = { 
      pinned: false, 
      timestamp: Date.now(),
      // Preserve required fields from schema
      url: existingSeries.url,
      title: existingSeries.title,
      slug: existingSeries.slug,
      source: existingSeries.source
    };
    
    return rs.editSeries(slug, source, updatedData);
  },

  // AIDEV-NOTE: CRITICAL - Filtered queries for different views, especially for "Obras" page reliability
  async getAllPinnedSeries() {
    try {
      const allSeries = await remoteStorage['Gika']?.getAllSeries();
      const cleanSeries = cleanMalformedData(allSeries || {}, 'series');
      const all = getSortedArray(cleanSeries);
      const deduplicated = deduplicateSeries(all); // AIDEV-NOTE: Remove duplicates before filtering
      const pinned = deduplicated.filter(e => e.pinned);
      
      if (import.meta.env?.DEV) {
        console.log(`📌 [API] getAllPinnedSeries: Total series: ${all.length}, Deduplicated: ${deduplicated.length}, Pinned: ${pinned.length}`);
      }
      
      return pinned;
    } catch (error) {
      console.error('❌ [API] getAllPinnedSeries: Erro ao carregar séries pinadas:', error);
      return [];
    }
  },

  async getAllUnpinnedSeries() {
    try {
      const allSeries = await remoteStorage['Gika']?.getAllSeries();
      const cleanSeries = cleanMalformedData(allSeries || {}, 'series');
      const all = getSortedArray(cleanSeries);
      const deduplicated = deduplicateSeries(all); // AIDEV-NOTE: Remove duplicates before filtering
      const unpinned = deduplicated.filter(e => !e.pinned);
      
      if (import.meta.env?.DEV) {
        console.log(`📄 [API] getAllUnpinnedSeries: Total series: ${all.length}, Deduplicated: ${deduplicated.length}, Unpinned: ${unpinned.length}`);
      }
      
      return unpinned;
    } catch (error) {
      console.error('❌ [API] getAllUnpinnedSeries: Erro ao carregar séries não pinadas:', error);
      return [];
    }
  },

  // AIDEV-NOTE: Hub management methods
  addHub: (url, title, iconUrl) => {
    const normalizedUrl = normalizeHubUrl(url);
    return remoteStorage['Gika']?.addHub(normalizedUrl, title, iconUrl);
  },

  removeHub: (url) => {
    const normalizedUrl = normalizeHubUrl(url);
    return remoteStorage['Gika']?.removeHub(normalizedUrl);
  },

  async getAllHubs() {
    try {
      const hubs = await remoteStorage['Gika']?.getAllHubs();
      const cleanHubs = cleanMalformedData(hubs || {}, 'hub');
      const hubArray = getSortedArray(cleanHubs);
      
      // AIDEV-NOTE: Remove duplicatas de hub baseado em URL normalizada
      const seen = new Set();
      const deduplicated = hubArray.filter(hub => {
        if (!hub || !hub.url) return false;
        const normalizedUrl = normalizeHubUrl(hub.url);
        if (seen.has(normalizedUrl)) {
          console.warn('⚠️ [API] getAllHubs: Hub duplicado removido:', hub.url);
          return false;
        }
        seen.add(normalizedUrl);
        return true;
      });
      
      return deduplicated;
    } catch (error) {
      console.error('❌ [API] getAllHubs: Erro ao carregar hubs:', error);
      return [];
    }
  },

  // AIDEV-NOTE: Função para resetar flag de sync
  resetSync,

  // AIDEV-NOTE: Clean corrupted data permanently from RemoteStorage
  async cleanupCorruptedData() {
    const rs = remoteStorage['Gika'];
    if (!rs) return false;

    try {
      console.log('🧹 [API] cleanupCorruptedData: Iniciando limpeza permanente...');
      
      // Get all series data
      const allSeries = await rs.getAllSeries();
      if (!allSeries) {
        console.log('📭 [API] cleanupCorruptedData: Nenhum dado de séries encontrado.');
        return false;
      }

      const keysToRemove = [];
      let totalEntries = 0;
      
      // AIDEV-NOTE: Use centralized validation to identify corrupted entries
      for (const [key, series] of Object.entries(allSeries)) {
        totalEntries++;
        let shouldRemove = false;
        let reason = '';

        // First check for obvious corruption
        const corruptionReason = isObviouslyCorrupted(key, series);
        if (corruptionReason) {
          shouldRemove = true;
          reason = corruptionReason;
        }
        // Then validate against series schema
        else if (!isValidSeries(series)) {
          shouldRemove = true;
          reason = 'série com campos obrigatórios ausentes ou inválidos';
        }

        if (shouldRemove) {
          console.log(`🗑️ [API] cleanupCorruptedData: Marcando para remoção (${reason}):`, key);
          keysToRemove.push(key);
        }
      }

      console.log(`🔍 [API] cleanupCorruptedData: Analisadas ${totalEntries} entradas, ${keysToRemove.length} marcadas para remoção.`);

      // Remove corrupted entries permanently
      let removedCount = 0;
      for (const key of keysToRemove) {
        try {
          await rs.removeSeriesByKey(key);
          removedCount++;
          console.log(`✅ [API] cleanupCorruptedData: Removido permanentemente (${removedCount}/${keysToRemove.length}):`, key);
        } catch (error) {
          console.error('❌ [API] cleanupCorruptedData: Erro ao remover:', key, error);
        }
      }

      // Also check and clean hubs using centralized validation
      try {
        const allHubs = await rs.getAllHubs();
        const hubsToRemove = [];
        
        if (allHubs) {
          for (const [key, hub] of Object.entries(allHubs)) {
            let shouldRemove = false;
            let reason = '';

            // Use centralized validation for hubs
            const corruptionReason = isObviouslyCorrupted(key, hub);
            if (corruptionReason) {
              shouldRemove = true;
              reason = corruptionReason;
            }
            else if (!isValidHub(hub)) {
              shouldRemove = true;
              reason = 'hub com campos obrigatórios ausentes ou inválidos';
            }

            if (shouldRemove) {
              console.log(`🗑️ [API] cleanupCorruptedData: Hub marcado para remoção (${reason}):`, key);
              hubsToRemove.push(key);
            }
          }

          for (const key of hubsToRemove) {
            try {
              await rs.removeHub(key.replace('hubs/', ''));
              removedCount++; // Count hub removals too
              console.log('✅ [API] cleanupCorruptedData: Hub removido permanentemente:', key);
            } catch (error) {
              console.error('❌ [API] cleanupCorruptedData: Erro ao remover hub:', key, error);
            }
          }
        }
      } catch (error) {
        console.error('❌ [API] cleanupCorruptedData: Erro ao limpar hubs:', error);
      }

      if (removedCount > 0) {
        console.log(`🧹 [API] cleanupCorruptedData: Limpeza concluída. ${removedCount} entradas removidas permanentemente.`);
        return true;
      } else {
        console.log('✨ [API] cleanupCorruptedData: Nenhum dado corrompido encontrado.');
        return false;
      }

    } catch (error) {
      console.error('❌ [API] cleanupCorruptedData: Erro na limpeza:', error);
      return false;
    }
  },

  // AIDEV-NOTE: Função para limpeza manual de dados corrompidos
  cleanCorruptedData: cleanCorruptedRemoteStorageData,
};

if (typeof window !== 'undefined') {
  window.gikaApi = api; // AIDEV-NOTE: Exposed for debugging purposes
}

// AIDEV-NOTE: One-time sync execution on app load
sync();

// AIDEV-NOTE: Export individual functions for direct import
export { cleanCorruptedRemoteStorageData };

export default api;