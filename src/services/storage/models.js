export const declareDataModels = (privateClient) => {
    // Modelo para as séries (ou "itens")
    privateClient.declareType('SERIES_META', {
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

    // Modelo para os Hubs
    privateClient.declareType('HUB_META', {
        type: "object",
        properties: {
            url: { type: "string" },
            title: { type: "string" },
            iconUrl: { type: "string" },
            timestamp: { type: "number" },
        },
        required: ["url", "title", "timestamp"],
    });
};
