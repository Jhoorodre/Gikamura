import React, { createContext, useContext, useState, useEffect } from 'react';
import { initRemoteStorage } from '../utils/remoteStorageInit';

const HistoryContext = createContext();
export const useHistory = () => useContext(HistoryContext);

export const HistoryProvider = ({ children }) => {
    const SORT_KEY = "timestamp";
    const MAX_VALUES = 20;

    const [storage, setStorage] = useState({ remoteStorage: null, hubStorage: null });

    useEffect(() => {
        const initializedStorage = initRemoteStorage();
        if (initializedStorage) {
            setStorage(initializedStorage);
        }
    }, []);

    const { remoteStorage, hubStorage } = storage;

    if (!hubStorage) {
        return null;
    }

    const sortObjectByKey = (obj, key) => {
        return obj ? Object.values(obj).sort((a, b) => b[key] - a[key]) : [];
    };

    const syncAndClean = async () => {
        const allSeries = await hubStorage.getAllSeries();
        for (const [key, value] of Object.entries(allSeries)) {
            if (!value || !value[SORT_KEY]) {
                const separatorIndex = key.indexOf("-");
                const slug = key.slice(separatorIndex + 1);
                const source = key.slice(0, separatorIndex);
                await hubStorage.removeSeries(slug, source);
            }
        }
    };

    const pushSeries = async (slug, coverUrl, source, url, title) => {
        await syncAndClean();
        let allCurrentSeries = sortObjectByKey(await hubStorage.getAllSeries() || {}, SORT_KEY);
        const existingSeries = allCurrentSeries.find(e => e.slug === slug && e.source === source);
        allCurrentSeries = allCurrentSeries.filter(e => !e.pinned);

        while (allCurrentSeries.length + (existingSeries ? 0 : 1) > MAX_VALUES) {
            const last = allCurrentSeries.pop();
            await hubStorage.removeSeries(last.slug, last.source);
        }

        return existingSeries
            ? hubStorage.editSeries(slug, coverUrl, source, url, title, existingSeries.pinned, existingSeries.chapters)
            : hubStorage.addSeries(slug, coverUrl, source, url, title);
    };

    const addChapters = async (slug, source, chapters) => {
        const series = await hubStorage.getSeries(slug, source);
        if (series) {
            const updatedChapters = [...new Set([...chapters, ...series.chapters])];
            return hubStorage.editSeries(slug, undefined, source, undefined, undefined, undefined, updatedChapters);
        }
    };
    
    const pinSeries = async (slug, coverUrl, source, url, title) => {
        const series = await hubStorage.getSeries(slug, source);
        if (series) {
            return hubStorage.editSeries(slug, undefined, source, undefined, undefined, true);
        } else {
            return hubStorage.addSeries(slug, coverUrl, source, url, title, true);
        }
    };

    const value = {
        remoteStorage,
        max: MAX_VALUES,
        pushSeries,
        removeSeries: (slug, source) => syncAndClean().then(() => hubStorage.removeSeries(slug, source)),
        addChapters,
        addChapter: (slug, source, chapter) => addChapters(slug, source, [chapter]),
        getReadChapters: async (slug, source) => (await hubStorage.getSeries(slug, source))?.chapters || [],
        pinSeries,
        unpinSeries: (slug, source) => hubStorage.editSeries(slug, undefined, source, undefined, undefined, false),
        getAllPinnedSeries: async () => syncAndClean().then(async () => sortObjectByKey(await hubStorage.getAllSeries() || {}, SORT_KEY).filter(e => e.pinned)),
        getAllUnpinnedSeries: async () => syncAndClean().then(async () => sortObjectByKey(await hubStorage.getAllSeries() || {}, SORT_KEY).filter(e => !e.pinned)),
        addHub: hubStorage.addHub,
        removeHub: hubStorage.removeHub,
        getAllHubs: async () => sortObjectByKey(await hubStorage.getAllHubs(), "timestamp"),
        savePreferences: hubStorage.savePreferences,
        loadPreferences: hubStorage.loadPreferences,
    };

    return (
        <HistoryContext.Provider value={value}>
            {children}
        </HistoryContext.Provider>
    );
};
