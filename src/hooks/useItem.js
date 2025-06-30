import { useState, useCallback } from 'react';
import { fetchData } from '../services/api';
import { remoteStorage } from '../services/remotestorage';
import { RS_PATH } from '../services/rs/rs-config';

export const useItem = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedItemData, setSelectedItemData] = useState(null);

    const fetchItemData = useCallback(async (itemObject, sourceId) => {
        setLoading(true);
        setError(null);

        if (!sourceId || !itemObject?.data?.url) {
            setError("Informações da série incompletas para carregar.");
            setLoading(false);
            return;
        }

        try {
            const module = remoteStorage[RS_PATH];
            // Busca o progresso e os dados da série em paralelo
            const [progress, seriesData] = await Promise.all([
                (remoteStorage.connected && module) 
                    ? module.getSeriesProgress(itemObject.slug, sourceId).catch(() => null) 
                    : Promise.resolve(null),
                fetchData(itemObject.data.url)
            ]);

            setSelectedItemData({
                ...itemObject,
                ...seriesData,
                entries: seriesData.chapters,
                sourceId: sourceId,
                readChapterKeys: progress?.readChapterKeys || [],
                lastRead: progress?.lastRead || null,
            });
        } catch (err) {
            console.error("Erro ao carregar dados do item:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const clearSelectedItem = () => setSelectedItemData(null);

    return { loading, error, fetchItemData, selectedItemData, clearSelectedItem };
};
