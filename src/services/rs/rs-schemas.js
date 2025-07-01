import { RS_PATH } from "./rs-config.js";
import { encodeUrl } from '../../utils/encoding';

const SERIES_TYPE = "series";
const HUB_TYPE = "hub";

const SERIES_PATH_BASE = "series/";
const HUB_PATH_BASE = "hubs/";

export const Model = {
  name: RS_PATH,
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
      },
      required: ["slug", "source", "url", "title", "timestamp", "chapters", "pinned"],
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

    // --- Funções Auxiliares ---
    const getSeriesKey = (slug, source) => `${source}-${slug}`;
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

        getAllSeries: () => {
          // Cache de 60 segundos para leituras em massa quando conectado
          const maxAge = privateClient.storage.connected ? 60000 : false;
          return privateClient.getAll(SERIES_PATH_BASE, maxAge);
        },

        // --- Métodos de Hubs ---
        addHub: (url, title, iconUrl) => {
          const hubKey = getHubKey(url);
          const hubData = { url, title, iconUrl: iconUrl || "", timestamp: Date.now() };
          return privateClient.storeObject(HUB_TYPE, `${HUB_PATH_BASE}${hubKey}`, hubData);
        },

        removeHub: (url) => {
          const hubKey = getHubKey(url);
          return privateClient.remove(`${HUB_PATH_BASE}${hubKey}`);
        },

        getAllHubs: () => privateClient.getAll(HUB_PATH_BASE),
      },
    };
  },
};