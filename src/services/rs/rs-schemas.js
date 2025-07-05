import { RS_PATH } from "./rs-config.js";
import { encodeUrl } from '../../utils/encoding';

const SERIES_TYPE = "series";
const HUB_TYPE = "hub";
const PROGRESS_TYPE = "progress";

const SERIES_PATH_BASE = "series/";
const HUB_PATH_BASE = "hubs/";

/**
 * Define schemas e funções auxiliares do RemoteStorage
 * AIDEV-NOTE: Declares all types and helpers for RemoteStorage integration
 */
export const Model = {
  name: RS_PATH.BASE,
  builder: (privateClient) => {
    // --- Definição dos Schemas ---
    privateClient.declareType(SERIES_TYPE, {
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
        "@context": { type: "string" }
      },
      required: ["slug", "source", "url", "title", "timestamp"],
      additionalProperties: true
    });

    privateClient.declareType(HUB_TYPE, {
      type: "object",
      properties: {
        url: { type: "string" },
        title: { type: "string" },
        iconUrl: { type: "string" },
        timestamp: { type: "number" },
      },
      required: ["url", "title", "timestamp"],
    });

    privateClient.declareType(PROGRESS_TYPE, {
      type: "object",
      properties: {
        lastChapter: { type: "string" },
        lastUpdated: { type: "number" },
        "@context": { type: "string" }
      },
      required: ["lastChapter", "lastUpdated"],
      additionalProperties: true
    });

    // --- Funções Auxiliares ---

    // AIDEV-NOTE: Sanitiza e codifica a source para garantir chaves válidas no RemoteStorage
    const getSeriesKey = (slug, source) => {
      if (!source || !slug) {
        console.error(`[RS] Tentativa de criar chave com slug ou source inválido:`, { slug, source });
        // Retorna um valor que indica erro, mas não quebra a aplicação
        return `invalid-key-${Date.now()}`;
      }
      // Remove caracteres inválidos para nomes de ficheiro e codifica a source
      const sanitizedSource = source.replace(/[:/\\?#*|"<>]/g, '_');
      return `${encodeURIComponent(sanitizedSource)}-${slug}`;
    };
    const getHubKey = (url) => encodeUrl(url);

    // --- Métodos Exportados (API de Baixo Nível) ---
    return {
      exports: {
        // --- Métodos de Séries ---
        addSeries: (slug, coverUrl, source, url, title, pinned, chapters) => {
          const seriesKey = getSeriesKey(slug, source);
          const seriesData = {
            slug,
            coverUrl: coverUrl || "",
            source,
            url,
            title,
            timestamp: Date.now(),
            chapters: chapters || [],
            pinned: !!pinned,
          };
          return privateClient.storeObject(SERIES_TYPE, `${SERIES_PATH_BASE}${seriesKey}`, seriesData);
        },

        editSeries: async (slug, source, updates) => {
          const seriesKey = getSeriesKey(slug, source);
          const path = `${SERIES_PATH_BASE}${seriesKey}`;
          const existing = await privateClient.getObject(path);
          if (!existing) {
            console.error(`[RS] Tentativa de editar série inexistente: ${seriesKey}`);
            return;
          }
          // Atualiza o timestamp em qualquer edição
          const updatedData = { ...existing, ...updates, timestamp: Date.now() };
          return privateClient.storeObject(SERIES_TYPE, path, updatedData);
        },

        getSeries: (slug, source) => {
          const seriesKey = getSeriesKey(slug, source);
          return privateClient.getObject(`${SERIES_PATH_BASE}${seriesKey}`);
        },

        removeSeries: (slug, source) => {
          const seriesKey = getSeriesKey(slug, source);
          return privateClient.remove(`${SERIES_PATH_BASE}${seriesKey}`);
        },

        // AIDEV-NOTE: Remove series by direct key (for cleanup purposes)
        removeSeriesByKey: async (key) => {
          try {
            if (key.startsWith(SERIES_PATH_BASE)) {
              return await privateClient.remove(key);
            }
            return await privateClient.remove(`${SERIES_PATH_BASE}${key}`);
          } catch (error) {
            // AIDEV-NOTE: Silent fail for non-existing keys during cleanup
            if (error.message && error.message.includes('non-existing')) {
              console.warn(`[RS] Tentativa de remover chave inexistente: ${key}`);
              return Promise.resolve();
            }
            throw error;
          }
        },

        getAllSeries: () => {
          // Não usar maxAge por incompatibilidade com versão atual do RemoteStorage
          return privateClient.getAll(SERIES_PATH_BASE);
        },

        // --- Métodos de Hubs ---
        addHub: (url, title, iconUrl) => {
          const hubKey = getHubKey(url);
          const hubData = { url, title, iconUrl: iconUrl || "", timestamp: Date.now() };
          return privateClient.storeObject(HUB_TYPE, `${HUB_PATH_BASE}${hubKey}`, hubData);
        },

        removeHub: async (url) => {
          try {
            const hubKey = getHubKey(url);
            return await privateClient.remove(`${HUB_PATH_BASE}${hubKey}`);
          } catch (error) {
            // AIDEV-NOTE: Silent fail for non-existing keys during cleanup
            if (error.message && error.message.includes('non-existing')) {
              console.warn(`[RS] Tentativa de remover hub inexistente: ${url}`);
              return Promise.resolve();
            }
            throw error;
          }
        },

        getAllHubs: () => privateClient.getAll(HUB_PATH_BASE),

        // --- Método genérico de remoção ---
        remove: async (path) => {
          try {
            return await privateClient.remove(path);
          } catch (error) {
            // AIDEV-NOTE: Silent fail for non-existing keys during cleanup
            if (error.message && error.message.includes('non-existing')) {
              console.warn(`[RS] Tentativa de remover path inexistente: ${path}`);
              return Promise.resolve();
            }
            throw error;
          }
        },
      },
    };
  },
};