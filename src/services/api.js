// AIDEV-NOTE: Series CRUD operations, history management, and RemoteStorage sync
import { remoteStorage } from "./remotestorage.js";
import { RS_PATH } from "./rs/rs-config.js";
import { withErrorHandling, AppError, ERROR_TYPES } from "../utils/errorHandler.js";
import { sanitizeUrl, sanitizeHtml } from "../utils/security/urlSanitizer.js";

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
  let duplicatesFound = 0;
  
  // AIDEV-NOTE: Throttle para evitar spam de logs de duplicatas
  const now = Date.now();
  const shouldLog = now - lastDeduplicateLog > 30000; // Log apenas a cada 30 segundos
  
  // Sort by timestamp descending first to keep most recent
  const sorted = series.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  
  for (const item of sorted) {
    if (!item.source || !item.slug || !item.title) {
      if (shouldLog) {
        console.warn('⚠️ [API] deduplicateSeries: Item sem source, slug ou title encontrado:', item);
      }
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
    } else {
      duplicatesFound++;
      if (shouldLog && import.meta.env?.DEV) {
        console.warn(`⚠️ [API] deduplicateSeries: Duplicata removida: ${item.title} (${item.slug})`);
      }
    }
  }
  
  if (shouldLog && import.meta.env?.DEV && duplicatesFound > 0) {
    console.log(`🧹 [API] deduplicateSeries: ${series.length} -> ${deduplicated.length} (removidas ${duplicatesFound} duplicatas)`);
    lastDeduplicateLog = now;
  }
  
  return deduplicated;
};

let syncExecuted = false;
let lastSyncTime = 0;

// AIDEV-NOTE: Cache para evitar chamadas excessivas ao RemoteStorage
let seriesCache = null;
let hubsCache = null;
let cacheTime = 0;
const CACHE_DURATION = 60000; // 60 segundos (1 minuto)

// AIDEV-NOTE: Throttling timestamps para evitar spam de logs
let lastDeduplicateLog = 0;
let lastHubDuplicateLog = 0;

/**
 * AIDEV-NOTE: Reset sync flag and caches to allow re-execution on reconnection
 */
const resetSync = () => {
  syncExecuted = false;
  lastSyncTime = 0;
  seriesCache = null;
  hubsCache = null;
  cacheTime = 0;
  lastDeduplicateLog = 0;
  lastHubDuplicateLog = 0;
  console.log('[API] Sync flag e caches resetados para permitir nova execução');
};

/**
 * AIDEV-NOTE: Get cached series or fetch from RemoteStorage
 */
const getCachedSeries = async () => {
  const now = Date.now();
  if (seriesCache && (now - cacheTime < CACHE_DURATION)) {
    return seriesCache;
  }
  
  const rs = remoteStorage['Gika'];
  if (!rs) return null;
  
  seriesCache = await rs.getAllSeries();
  cacheTime = now;
  return seriesCache;
};

/**
 * AIDEV-NOTE: Get cached hubs or fetch from RemoteStorage
 */
const getCachedHubs = async () => {
  const now = Date.now();
  if (hubsCache && (now - cacheTime < CACHE_DURATION)) {
    return hubsCache;
  }
  
  const rs = remoteStorage['Gika'];
  if (!rs) return null;
  
  hubsCache = await rs.getAllHubs();
  cacheTime = now;
  return hubsCache;
};

/**
 * AIDEV-NOTE: Clear caches when data changes
 */
const clearCaches = () => {
  seriesCache = null;
  hubsCache = null;
  cacheTime = 0;
  lastDeduplicateLog = 0;
  lastHubDuplicateLog = 0;
};

/**
 * AIDEV-NOTE: Ensures local cache doesn't have invalid objects and cleans up corrupted data
 * with throttling to prevent excessive execution
 */
const sync = async () => {
  const now = Date.now();
  
  // AIDEV-NOTE: Throttle sync execution to prevent excessive calls
  if (syncExecuted || (now - lastSyncTime < 10000)) {
    return;
  }
  
  lastSyncTime = now;
  const rs = remoteStorage['Gika'];
  if (!rs) return;

  try {
    const allSeries = await getCachedSeries();
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
        // AIDEV-NOTE: Verify rs.custom exists before attempting removal
        if (!rs.custom) {
          console.warn('[API Sync] ⚠️ rs.custom não disponível para remoção:', key);
          continue;
        }
        
        // AIDEV-NOTE: Try multiple removal strategies for corrupted entries
        let removed = false;
        
        // Strategy 1: Try direct key removal first (safest for corrupted data)
        try {
          const path = key.startsWith('/') ? key.substring(1) : key;
          await rs.custom.remove(path);
          removed = true;
          console.log('[API Sync] ✅ Removido (direto):', key);
        } catch (directError) {
          // Strategy 2: Try specific removal methods
          if (key.includes('series/') || (!key.includes('hubs/') && !key.includes('/'))) {
            try {
              await rs.custom.removeSeriesByKey(key);
              removed = true;
              console.log('[API Sync] ✅ Removido (série):', key);
            } catch (seriesError) {
              // If series removal fails, try removing from full path
              try {
                await rs.custom.remove(`series/${key}`);
                removed = true;
                console.log('[API Sync] ✅ Removido (série path):', key);
              } catch (seriesPathError) {
                console.warn('[API Sync] ⚠️ Falha ao remover série:', key, seriesPathError.message);
              }
            }
          } else if (key.includes('hubs/')) {
            try {
              // For hub entries, remove directly
              const hubUrl = key.replace('hubs/', '');
              await rs.custom.removeHub(hubUrl);
              removed = true;
              console.log('[API Sync] ✅ Removido (hub):', key);
            } catch (hubError) {
              console.warn('[API Sync] ⚠️ Falha ao remover hub:', key, hubError.message);
            }
          }
          
          if (!removed) {
            console.warn('[API Sync] ⚠️ Não foi possível remover:', key, directError.message);
          }
        }
        
        if (removed) {
          hasChanges = true;
        }
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

  // AIDEV-NOTE: Adds or updates series with history limit enforcement and URL sanitization
  async pushSeries(slug, coverUrl, source, url, title) {
    console.log('📊 [API] pushSeries called with:', { slug, coverUrl, source, url, title });
    
    // Sanitize inputs
    const sanitizedUrl = sanitizeUrl(url);
    if (!sanitizedUrl) {
      throw new AppError('URL da série inválida ou insegura', ERROR_TYPES.VALIDATION);
    }
    const sanitizedCoverUrl = coverUrl ? sanitizeUrl(coverUrl) : null;
    const sanitizedTitle = sanitizeHtml(title);
    
    const rs = remoteStorage['Gika'];
    if (!rs) {
      throw new AppError('RemoteStorage não disponível', ERROR_TYPES.STORAGE);
    }
    const cachedSeries = await getCachedSeries();
    const allSeries = getSortedArray(cachedSeries || {});
    const existingSeries = allSeries.find(e => e.slug === slug && e.source === source);

    if (existingSeries) {
      // AIDEV-NOTE: Preserve all required fields when updating existing series
      console.log('📊 [API] Updating existing series');
      const updatedData = { 
        title: sanitizedTitle, 
        url: sanitizedUrl, 
        coverUrl: sanitizedCoverUrl,
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
    return rs.addSeries(slug, sanitizedCoverUrl, source, sanitizedUrl, sanitizedTitle, false, []);
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
   * AIDEV-NOTE: Robust pin/unpin functionality with proper error handling for new series
   * Fixes: "rs.storeObject is not a function" by using correct schema methods
   */
  async pinSeries(item) {
    console.debug("[api.pinSeries] Chamado com:", item);
    
    const { id, slug, source, url, title, coverUrl } = item;

    if (!source || !slug) {
      console.error("[api.pinSeries] 'source' e 'slug' são obrigatórios.");
      throw new Error("Dados insuficientes para fixar a série.");
    }

    // Sanitize inputs
    const sanitizedUrl = url ? sanitizeUrl(url) : null;
    const sanitizedCoverUrl = coverUrl ? sanitizeUrl(coverUrl) : null;
    const sanitizedTitle = title ? sanitizeHtml(title) : null;

    const rs = remoteStorage['Gika'];
    let existingSeries = null;
    
    try {
      // AIDEV-NOTE: Try to get existing series, handle 404 gracefully
      existingSeries = await rs.getSeries(slug, source);
    } catch (error) {
      // AIDEV-NOTE: Series doesn't exist yet, will create new one
      console.debug("[api.pinSeries] Série não existe ainda (404), criando nova:", error.message);
      existingSeries = null;
    }

    if (existingSeries) {
      console.debug("[api.pinSeries] Série já existe, editando para pinned:true");
      // AIDEV-NOTE: Preserve all required fields when editing existing series
      const updatedData = { 
        pinned: true, 
        timestamp: Date.now(),
        // Preserve required fields from schema (sanitized)
        url: existingSeries.url || sanitizedUrl,
        title: existingSeries.title || sanitizedTitle,
        slug: existingSeries.slug || slug,
        source: existingSeries.source || source
      };
      const result = await rs.editSeries(slug, source, updatedData);
      clearCaches(); // AIDEV-NOTE: Clear caches after data modification
      console.debug('[api.pinSeries] Sucesso ao editar série existente:', result);
      return result;
    }
    
    console.debug("[api.pinSeries] Série não existe, criando nova como pinned:true");
    // AIDEV-NOTE: Use addSeries method instead of direct storeObject call
    if (!sanitizedUrl) {
      throw new AppError('URL da série inválida ou insegura', ERROR_TYPES.VALIDATION);
    }
    const result = await rs.addSeries(slug, sanitizedCoverUrl, source, sanitizedUrl, sanitizedTitle, true, []);
    clearCaches(); // AIDEV-NOTE: Clear caches after data modification
    console.debug('[api.pinSeries] Sucesso ao criar nova série:', result);
    return result;
  },

  async unpinSeries(slug, source) {
    // AIDEV-NOTE: Get existing series to preserve required fields during unpin
    const rs = remoteStorage['Gika'];
    let existingSeries = null;
    
    try {
      existingSeries = await rs.getSeries(slug, source);
    } catch (error) {
      console.warn("[api.unpinSeries] Série não encontrada (404):", { slug, source });
      return;
    }
    
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
    
    const result = rs.editSeries(slug, source, updatedData);
    clearCaches(); // AIDEV-NOTE: Clear caches after data modification
    return result;
  },

  // AIDEV-NOTE: CRITICAL - Filtered queries for different views, especially for "Obras" page reliability
  async getAllPinnedSeries() {
    const result = await withErrorHandling(async () => {
      const allSeries = await getCachedSeries();
      if (!allSeries) return [];
      const cleanSeries = cleanMalformedData(allSeries || {}, 'series');
      const all = getSortedArray(cleanSeries || {});
      const deduplicated = deduplicateSeries(all); // AIDEV-NOTE: Remove duplicates before filtering
      const pinned = deduplicated.filter(e => e.pinned);
      
      if (import.meta.env?.DEV) {
        console.log(`📌 [API] getAllPinnedSeries: Total series: ${all.length}, Deduplicated: ${deduplicated.length}, Pinned: ${pinned.length}`);
      }
      
      return pinned;
    }, { operation: 'getAllPinnedSeries' });
    
    return result.success ? result.data : [];
  },

  async getAllUnpinnedSeries() {
    const result = await withErrorHandling(async () => {
      const allSeries = await getCachedSeries();
      if (!allSeries) return [];
      const cleanSeries = cleanMalformedData(allSeries || {}, 'series');
      const all = getSortedArray(cleanSeries || {});
      const deduplicated = deduplicateSeries(all); // AIDEV-NOTE: Remove duplicates before filtering
      const unpinned = deduplicated.filter(e => !e.pinned);
      
      if (import.meta.env?.DEV) {
        console.log(`📄 [API] getAllUnpinnedSeries: Total series: ${all.length}, Deduplicated: ${deduplicated.length}, Unpinned: ${unpinned.length}`);
      }
      
      return unpinned;
    }, { operation: 'getAllUnpinnedSeries' });
    
    return result.success ? result.data : [];
  },

  // AIDEV-NOTE: Hub management methods with URL sanitization
  addHub: (url, title, iconUrl) => {
    const sanitizedUrl = sanitizeUrl(url);
    if (!sanitizedUrl) {
      throw new AppError('URL inválida ou insegura', ERROR_TYPES.VALIDATION);
    }
    const normalizedUrl = normalizeHubUrl(sanitizedUrl);
    const sanitizedTitle = sanitizeHtml(title);
    const sanitizedIconUrl = iconUrl ? sanitizeUrl(iconUrl) : null;
    return remoteStorage['Gika']?.addHub(normalizedUrl, sanitizedTitle, sanitizedIconUrl);
  },

  removeHub: async (url) => {
    // AIDEV-NOTE: Robust hub removal with error handling and cache update
    try {
      const normalizedUrl = normalizeHubUrl(url);
      const result = await remoteStorage['Gika']?.removeHub(normalizedUrl);
      
      // AIDEV-NOTE: Clear cache after successful removal to force refresh
      if (hubsCache) {
        hubsCache = null;
        console.log('[API] Cache de hubs limpo após remoção');
      }
      
      return result;
    } catch (error) {
      // AIDEV-NOTE: Handle removal of non-existing hubs gracefully
      if (error.message && error.message.includes('non-existing')) {
        console.warn(`[API] Hub já foi removido: ${url}`);
        
        // AIDEV-NOTE: Clear cache to reflect actual state
        if (hubsCache) {
          hubsCache = null;
          console.log('[API] Cache de hubs limpo após tentativa de remoção de hub inexistente');
        }
        
        return Promise.resolve(); // Treat as successful removal
      }
      
      console.error('[API] Erro ao remover hub:', error);
      throw error;
    }
  },

  async getAllHubs() {
    // AIDEV-NOTE: Robust hub deduplication with permanent cleanup to prevent RemoteStorage errors
    try {
      const hubs = await getCachedHubs();
      const cleanHubs = cleanMalformedData(hubs || {}, 'hub');
      const hubArray = getSortedArray(cleanHubs);
      
      // AIDEV-NOTE: Remove duplicatas de hub baseado em URL normalizada com throttling
      const now = Date.now();
      const shouldLog = now - lastHubDuplicateLog > 30000; // Log apenas a cada 30 segundos
      
      const seen = new Set();
      const keysToRemove = [];
      let duplicatesFound = 0;
      
      // AIDEV-NOTE: Create mapping for efficient key lookup
      const hubToKeyMap = new Map();
      Object.entries(cleanHubs).forEach(([key, hub]) => {
        if (hub && hub.url) {
          hubToKeyMap.set(hub, key);
        }
      });
      
      const deduplicated = hubArray.filter(hub => {
        if (!hub || !hub.url) return false;
        const normalizedUrl = normalizeHubUrl(hub.url);
        if (seen.has(normalizedUrl)) {
          duplicatesFound++;
          // AIDEV-NOTE: Collect keys of duplicates for permanent removal
          const hubKey = hubToKeyMap.get(hub);
          if (hubKey) {
            keysToRemove.push({ key: hubKey, url: hub.url });
          }
          if (shouldLog) {
            console.warn('⚠️ [API] getAllHubs: Hub duplicado removido:', hub.url);
          }
          return false;
        }
        seen.add(normalizedUrl);
        return true;
      });
      
      // AIDEV-NOTE: Permanently remove duplicates from RemoteStorage
      if (keysToRemove.length > 0) {
        const rs = remoteStorage['Gika'];
        if (rs) {
          for (const { key, url } of keysToRemove) {
            try {
              if (shouldLog) {
                console.log(`🗑️ [API] getAllHubs: Tentando remover duplicata: ${key} para URL: ${url}`);
              }
              await rs.remove(`hubs/${key}`);
              if (shouldLog) {
                console.log(`✅ [API] getAllHubs: Duplicata removida permanentemente: ${url}`);
              }
            } catch (error) {
              // AIDEV-NOTE: Ignore errors for already removed items
              if (error.message?.includes('non-existing')) {
                if (shouldLog) {
                  console.warn(`⚠️ [API] getAllHubs: Duplicata já removida: ${url}`);
                }
              } else {
                console.warn(`❌ [API] getAllHubs: Erro ao remover duplicata ${url}:`, error);
              }
            }
          }
          // AIDEV-NOTE: Clear cache to reflect changes
          hubsCache = null;
        }
      }
      
      if (shouldLog && duplicatesFound > 0) {
        lastHubDuplicateLog = now;
      }
      
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
          // AIDEV-NOTE: Use robust removal method
          if (rs && rs.removeSeriesByKey) {
            await rs.removeSeriesByKey(key);
            removedCount++;
            console.log(`✅ [API] cleanupCorruptedData: Removido permanentemente (${removedCount}/${keysToRemove.length}):`, key);
          } else {
            console.warn(`⚠️ [API] cleanupCorruptedData: Função de remoção não disponível para:`, key);
          }
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
  
  // AIDEV-NOTE: Cache management functions
  clearCaches,
  resetSync,
};

if (typeof window !== 'undefined') {
  window.gikaApi = api; // AIDEV-NOTE: Exposed for debugging purposes
}

// AIDEV-NOTE: One-time sync execution on app load
sync();

// AIDEV-NOTE: Export individual functions for direct import
export { cleanCorruptedRemoteStorageData, clearCaches, resetSync };

export default api;