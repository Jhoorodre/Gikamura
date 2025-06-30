import { useState } from 'react';
import { fetchData } from '../services/api';
import { remoteStorage } from '../services/remoteStorage';

// Validação mais detalhada dos dados do item
const validateItemData = (data) => {
    if (!data || typeof data !== 'object') {
        throw new Error("Os dados do item não são um objeto válido.");
    }
    if (typeof data.title !== 'string' || data.title.trim() === '') {
        throw new Error("A propriedade 'title' é inválida.");
    }
    if (typeof data.chapters !== 'object' || data.chapters === null) {
        throw new Error("A propriedade 'chapters' está ausente ou não é um objeto.");
    }
    // Verifica se os capítulos têm a estrutura esperada
    for (const key in data.chapters) {
        if (typeof data.chapters[key].title !== 'string' || !Array.isArray(data.chapters[key].groups?.['TOG Brasil'])) {
            throw new Error(`A estrutura do capítulo '${key}' é inválida.`);
        }
    }
    return true;
};

const CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 1 hora

export const useItem = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [offline, setOffline] = useState(false);
    const [offlineError, setOfflineError] = useState(null);
    const [selectedItemData, setSelectedItemData] = useState(null);

    // Busca dados do remoteStorage, retorna {data, timestamp} ou null
    const getCachedSeries = async (itemObject) => {
        try {
            const series = await remoteStorage.Gika.getSeries(itemObject.slug, itemObject.source?.id);
            if (series && series.url && series.timestamp) {
                const data = await fetchData(series.url, true); // true: força cache
                validateItemData(data);
                return { data, timestamp: series.timestamp };
            }
        } catch (e) {
            // Falha ao buscar do cache
        }
        return null;
    };

    // Salva dados no remoteStorage com timestamp
    const saveSeriesToCache = async (itemObject, chapters) => {
        try {
            await remoteStorage.Gika.saveSeries({
                ...itemObject,
                entries: chapters,
                timestamp: Date.now(),
            });
        } catch (e) {
            // Falha ao salvar no cache
        }
    };

    // Estratégia offline-first com stale-while-revalidate
    const fetchItemData = async (itemObject) => {
        setLoading(true);
        setError(null);
        setOffline(false);
        setOfflineError(null);
        let cached = null;
        let usedCache = false;
        try {
            // 1. Tenta buscar do remoteStorage primeiro
            cached = await getCachedSeries(itemObject);
            if (cached) {
                setOffline(true);
                setSelectedItemData({ ...itemObject, entries: cached.data.chapters });
                usedCache = true;
            }
            // 2. Decide se precisa atualizar (expirado ou nunca buscou)
            const expired = !cached || (Date.now() - cached.timestamp > CACHE_EXPIRATION_MS);
            if (navigator.onLine && expired) {
                try {
                    const freshData = await fetchData(itemObject.data.url);
                    validateItemData(freshData);
                    // Só atualiza se mudou
                    if (!cached || JSON.stringify(cached.data.chapters) !== JSON.stringify(freshData.chapters)) {
                        setSelectedItemData({ ...itemObject, entries: freshData.chapters });
                        setOffline(false);
                        await saveSeriesToCache(itemObject, freshData.chapters);
                    }
                } catch (err) {
                    if (!usedCache) setError(err.message);
                }
            } else if (!cached && !navigator.onLine) {
                setError('Você está offline e este item não está disponível no cache.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, fetchItemData, offline, offlineError, selectedItemData };
};
