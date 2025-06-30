import { RS_PATH } from "./rs-config.js";

export const Model = {
  name: RS_PATH,
  builder: (privateClient) => {
    // === DEFINIÇÃO DOS SCHEMAS ===
    privateClient.declareType("hub", {
      type: "object",
      properties: {
        url: { type: "string" },
        title: { type: "string" },
        iconUrl: { type: "string" },
        timestamp: { type: "number" },
      },
      required: ["url", "title", "timestamp"],
    });

    privateClient.declareType("series", {
      type: "object",
      properties: {
        slug: { type: "string" },
        source: { type: "string" },
        title: { type: "string" },
        chapters: { type: "array", default: [] },
        lastRead: {
          type: "object",
          properties: {
            chapterKey: { type: "string" },
            page: { type: "number" },
          },
        },
        timestamp: { type: "number" },
      },
      required: ["slug", "source", "title", "timestamp"],
    });

    // === CAMINHOS ===
    const HUB_PATH = "hubs/";
    const SERIES_PATH = "series/";

    // === MÉTODOS PARA HUBS ===
    const addHub = (url, title, iconUrl) => {
      const hubId = btoa(url);
      const hubData = {
        url,
        title: title || "Hub Sem Título",
        iconUrl: iconUrl || "",
        timestamp: Date.now(),
      };
      return privateClient.storeObject("hub", `${HUB_PATH}${hubId}`, hubData);
    };

    const removeHub = (url) => {
      const hubId = btoa(url);
      return privateClient.remove(`${HUB_PATH}${hubId}`);
    };

    const getAllHubs = async () => {
      const listing = await privateClient.getListing(HUB_PATH);
      if (!listing || Object.keys(listing).length === 0) {
        return [];
      }
      const hubPromises = Object.keys(listing).map(hubId =>
        privateClient.getObject(`${HUB_PATH}${hubId}`).catch(err => {
          console.error(`Falha ao carregar hub ${hubId}:`, err);
          return null;
        })
      );
      const hubs = await Promise.all(hubPromises);
      return hubs
        .filter(hub => hub)
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    };

    // === MÉTODOS PARA SÉRIES E CAPÍTULOS ===
    const getSeriesKey = (slug, source) => `${source}-${slug}`;

    const getSeries = (slug, source) => {
      const seriesKey = getSeriesKey(slug, source);
      return privateClient.getObject(`${SERIES_PATH}${seriesKey}`);
    };

    const saveSeries = async (slug, source, title, chapters) => {
      const seriesKey = getSeriesKey(slug, source);
      let series = await privateClient.getObject(`${SERIES_PATH}${seriesKey}`).catch(() => null);
      if (!series) {
        series = { slug, source, title };
      }
      series.chapters = chapters;
      series.timestamp = Date.now();
      return privateClient.storeObject("series", `${SERIES_PATH}${seriesKey}`, series);
    };

    const addChapter = async (slug, source, chapterKey) => {
      const seriesKey = getSeriesKey(slug, source);
      let series = await privateClient.getObject(`${SERIES_PATH}${seriesKey}`).catch(() => null);
      if (series) {
        const chapters = [...new Set([...(series.chapters || []), chapterKey])];
        series.chapters = chapters;
        series.timestamp = Date.now();
        return privateClient.storeObject("series", `${SERIES_PATH}${seriesKey}`, series);
      }
    };

    const getReadChapters = async (slug, source) => {
      const series = await getSeries(slug, source).catch(() => null);
      return series ? series.chapters || [] : [];
    };

    const setLastReadPage = async (slug, source, chapterKey, page) => {
      const seriesKey = getSeriesKey(slug, source);
      let series = await privateClient.getObject(`${SERIES_PATH}${seriesKey}`).catch(() => null);
      if (series) {
        series.lastRead = { chapterKey, page };
        series.timestamp = Date.now();
        return privateClient.storeObject("series", `${SERIES_PATH}${seriesKey}`, series);
      }
    };

    // Exporta todas as funções que queremos usar na aplicação
    return {
      exports: {
        addHub,
        removeHub,
        getAllHubs,
        getSeries,
        saveSeries,
        addChapter,
        getReadChapters,
        setLastReadPage,
      },
    };
  },
};