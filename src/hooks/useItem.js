import { useState, useCallback } from 'react';
import { fetchData } from '../services/api';
import { remoteStorage } from '../services/remotestorage';
import { RS_PATH } from '../services/rs/rs-config';

const CACHE_EXPIRATION_MS = 60 * 60 * 1000;

export const useItem = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedItemData, setSelectedItemData] = useState(null);

    const fetchItemData = useCallback(async (itemObject, sourceId) => {
        setLoading(true);
        setError(null);

        if (!sourceId) {
            setError("A origem (sourceId) do item não foi fornecida.");
            setLoading(false);
            return;
        }

        try {
            const module = remoteStorage[RS_PATH];
            let cachedItem = null;

            if (remoteStorage.connected && module) {
                cachedItem = await module.getSeries(itemObject.slug, sourceId).catch(() => null);
            }

            // Estado inicial seguro
            setSelectedItemData({ ...itemObject, sourceId, chapters: cachedItem?.chapters || [] });

            const isCacheExpired = !cachedItem || (Date.now() - cachedItem.timestamp > CACHE_EXPIRATION_MS);

            if (navigator.onLine && isCacheExpired) {
                const freshData = await fetchData(itemObject.data.url);
                setSelectedItemData({ 
                    ...itemObject, 
                    sourceId, 
                    entries: freshData.chapters, 
                    chapters: cachedItem?.chapters || [] 
                });
                if (remoteStorage.connected && module) {
                    await module.saveSeries(itemObject.slug, sourceId, itemObject.title, freshData.chapters);
                }
            } else if (!cachedItem && !navigator.onLine) {
                setError("Você está offline e este item não está no cache.");
            } else if (cachedItem) {
                 setSelectedItemData({ 
                    ...itemObject, 
                    sourceId, 
                    entries: cachedItem.entries, 
                    chapters: cachedItem.chapters || [] 
                });
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const clearSelectedItem = () => setSelectedItemData(null);

    return { loading, error, fetchItemData, selectedItemData, clearSelectedItem };
};
