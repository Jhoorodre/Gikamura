// Módulos de schema para RemoteStorage
import { RS_PATH } from "./rs-config";

export const Model = {
  name: RS_PATH,
  builder: (privateClient) => {
    // Series
    const SERIES_META = "series";
    const SERIES_REPLACEMENT_STR = "{SOURCE_SLUG_REPLACEMENT}";
    const SERIES_META_PATH_BASE = "series/";
    const SERIES_META_PATH = `${SERIES_META_PATH_BASE}${SERIES_REPLACEMENT_STR}`;

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
      required: [
        "slug",
        "source",
        "url",
        "title",
        "timestamp",
        "chapters",
        "pinned",
      ],
    });

    // Hub
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

    // Funções auxiliares e exports
    let slugBuilder = (slug, source) => `${source}-${slug}`;
    let pathBuilder = (path, slug, source) => path.replace(SERIES_REPLACEMENT_STR, slugBuilder(slug, source));
    let seriesBuilder = (slug, coverUrl, source, url, title, pinned, chapters) => ({
      slug,
      coverUrl: coverUrl || "",
      source,
      url,
      title,
      timestamp: Date.now(),
      chapters: chapters || [],
      pinned: pinned === undefined ? false : pinned,
    });
    let hubPathBuilder = (path, hubUrl) => path.replace(HUB_REPLACEMENT_STR, btoa(hubUrl));
    let hubBuilder = (url, title, iconUrl) => ({ url, title, iconUrl: iconUrl || "", timestamp: Date.now() });

    return {
      exports: {
        slugBuilder,
        pathBuilder,
        seriesBuilder,
        hubPathBuilder,
        hubBuilder,
        SERIES_META,
        SERIES_META_PATH,
        SERIES_META_PATH_BASE,
        HUB_META,
        HUB_META_PATH,
        HUB_META_PATH_BASE,
      }
    };
  },
};
