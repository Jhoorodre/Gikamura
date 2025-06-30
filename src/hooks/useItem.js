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

export const useItem = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [offline, setOffline] = useState(false);
    const [offlineError, setOfflineError] = useState(null);

    // Novo: busca do cache do RemoteStorage
    const fetchItemData = async (itemObject, preferCache = false) => {
        setLoading(true);
        setError(null);
        setOffline(false);
        setOfflineError(null);
        try {
            let data = null;
            // Se preferCache ou offline, tenta buscar do RemoteStorage
            if (preferCache || !navigator.onLine) {
                try {
                    const series = await remoteStorage.Gika.getSeries(itemObject.slug, itemObject.source?.id);
                    if (series && series.url) {
                        // Busca o JSON do capítulo salvo
                        data = await fetchData(series.url);
                        validateItemData(data);
                        setOffline(true);
                        return { ...itemObject, entries: data.chapters };
                    }
                } catch (e) {
                    setOfflineError('Capítulo não disponível offline.');
                    throw new Error('Capítulo não disponível offline.');
                }
            }
            // Se online, busca normalmente
            data = await fetchData(itemObject.data.url);
            validateItemData(data);
            return { ...itemObject, entries: data.chapters };
        } catch (err) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, fetchItemData, offline, offlineError };
};
