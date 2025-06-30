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
        setSelectedItemData(null); // Limpa dados anteriores

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
                ? await module.getSeriesProgress(itemFromHub.slug, hubId).catch(() => null)
                : null;
            // Passo 3: Unifica todos os dados num único objeto
            setSelectedItemData({
                ...itemFromHub,          // Dados básicos do hub.json (id, slug, etc.)
                ...seriesDetails,        // Dados detalhados (title, description, author do reader.json)
                entries: seriesDetails.chapters, // Renomeia para 'entries' para uso interno
                sourceId: hubId,         // ID do Hub para salvar o progresso
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
