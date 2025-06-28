import React, { createContext, useContext } from 'react';
import remoteStorage, { RS_PATH } from '../services/storage/config';

const HistoryContext = createContext();
export const useHistory = () => useContext(HistoryContext);

export const HistoryProvider = ({ children }) => {
    const SORT_KEY = "timestamp";
    const MAX_VALUES = 20;
    const storageAPI = remoteStorage[RS_PATH];

    const sortObjectByKey = (obj, key) => {
        return obj ? Object.values(obj).sort((a, b) => b[key] - a[key]) : [];
    };

    const syncAndClean = async () => {
        const allSeries = await storageAPI.getAllSeries();
        for (const [key, value] of Object.entries(allSeries)) {
            if (!value || !value[SORT_KEY]) {
                const separatorIndex = key.indexOf("-");
                const slug = key.slice(separatorIndex + 1);
                const source = key.slice(0, separatorIndex);
                await storageAPI.removeSeries(slug, source);
            }
        }
    };

    const pushSeries = async (slug, coverUrl, source, url, title) => {
        await syncAndClean();
        let allCurrentSeries = sortObjectByKey(await storageAPI.getAllSeries() || {}, SORT_KEY);
        const existingSeries = allCurrentSeries.find(e => e.slug === slug && e.source === source);
        allCurrentSeries = allCurrentSeries.filter(e => !e.pinned);

        while (allCurrentSeries.length + (existingSeries ? 0 : 1) > MAX_VALUES) {
            const last = allCurrentSeries.pop();
            await storageAPI.removeSeries(last.slug, last.source);
        }

        return existingSeries
            ? storageAPI.editSeries(slug, coverUrl, source, url, title, existingSeries.pinned, existingSeries.chapters)
            : storageAPI.addSeries(slug, coverUrl, source, url, title);
    };

    const addChapters = async (slug, source, chapters) => {
        const series = await storageAPI.getSeries(slug, source);
        if (series) {
            const updatedChapters = [...new Set([...chapters, ...series.chapters])];
            return storageAPI.editSeries(slug, undefined, source, undefined, undefined, undefined, updatedChapters);
        }
    };
    
    const pinSeries = async (slug, coverUrl, source, url, title) => {
        const series = await storageAPI.getSeries(slug, source);
        if (series) {
            return storageAPI.editSeries(slug, undefined, source, undefined, undefined, true);
        } else {
            return storageAPI.addSeries(slug, coverUrl, source, url, title, true);
        }
    };

    const value = {
        remoteStorage,
        max: MAX_VALUES,
        pushSeries,
        removeSeries: (slug, source) => syncAndClean().then(() => storageAPI.removeSeries(slug, source)),
        addChapters,
        addChapter: (slug, source, chapter) => addChapters(slug, source, [chapter]),
        getReadChapters: async (slug, source) => (await storageAPI.getSeries(slug, source))?.chapters || [],
        pinSeries,
        unpinSeries: (slug, source) => storageAPI.editSeries(slug, undefined, source, undefined, undefined, false),
        getAllPinnedSeries: async () => syncAndClean().then(async () => sortObjectByKey(await storageAPI.getAllSeries() || {}, SORT_KEY).filter(e => e.pinned)),
        getAllUnpinnedSeries: async () => syncAndClean().then(async () => sortObjectByKey(await storageAPI.getAllSeries() || {}, SORT_KEY).filter(e => !e.pinned)),
        addHub: storageAPI.addHub,
        removeHub: storageAPI.removeHub,
        getAllHubs: async () => sortObjectByKey(await storageAPI.getAllHubs(), "timestamp"),
    };

    return (
        <HistoryContext.Provider value={value}>
            {children}
        </HistoryContext.Provider>
    );
};
