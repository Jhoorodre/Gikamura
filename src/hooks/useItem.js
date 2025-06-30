import { useState, useCallback } from 'react';
import { fetchData } from '../services/api';
import { remoteStorage } from '../services/remotestorage';
import { RS_PATH } from '../services/rs/rs-config';

export const useItem = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedItemData, setSelectedItemData] = useState(null);

    const fetchItemData = useCallback(async (itemFromHub, hubId) => {
        setLoading(true);
        setError(null);
        setSelectedItemData(null);

        if (!hubId || !itemFromHub?.data?.url) {
            setError("Ficheiro do Hub (hub.json) está mal configurado. Falta a 'data.url' da série.");
            setLoading(false);
            return;
        }

        try {
            // Passo 1: Busca os dados detalhados da série (o "reader.json")
            const seriesDetails = await fetchData(itemFromHub.data.url);
            // Passo 2: Em paralelo, busca o progresso de leitura, se conectado
            const module = remoteStorage[RS_PATH];
            const progress = (remoteStorage.connected && module)
                ? await module.getSeriesProgress(itemFromHub.slug, hubId)
                : null;
            // Passo 3: Unifica os dados de forma controlada e segura
            setSelectedItemData({
                // Começamos com os dados do hub, que tem a estrutura de 'cover' correta
                ...itemFromHub,
                // Sobrescrevemos explicitamente apenas os campos detalhados
                title: seriesDetails.title,
                description: seriesDetails.description,
                author: seriesDetails.author,
                entries: seriesDetails.chapters,
                sourceId: hubId,
                readChapterKeys: progress?.readChapterKeys || [],
                lastRead: progress?.lastRead || null,
            });
        } catch (err) {
            console.error("Erro detalhado ao carregar dados do item:", err);
            setError(`Não foi possível carregar os detalhes da série. Verifique a URL em hub.json. (Erro: ${err.message})`);
        } finally {
            setLoading(false);
        }
    }, []);

    const clearSelectedItem = () => setSelectedItemData(null);

    return { loading, error, fetchItemData, selectedItemData, clearSelectedItem };
};
