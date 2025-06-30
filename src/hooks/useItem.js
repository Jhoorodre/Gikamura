import { useState, useCallback } from 'react';
// Ferramenta para buscar dados de URLs (com cache)
import { fetchData } from '../services/fetchWithCache.js';
// Cérebro da aplicação, com a lógica de negócio (histórico, etc.)
import api from '../services/api.js';

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

            // Passo 2: Busca o progresso de leitura do usuário usando a API
            const readChapters = await api.getReadChapters(itemFromHub.slug, hubId);

            // Passo 3: Unifica os dados de forma controlada e segura
            const finalItemData = {
                ...itemFromHub,
                title: seriesDetails.title,
                description: seriesDetails.description,
                author: seriesDetails.author,
                entries: seriesDetails.chapters,
                sourceId: hubId,
                readChapterKeys: readChapters || [],
            };
            setSelectedItemData(finalItemData);

            // Passo 4: Atualiza o histórico do usuário em segundo plano.
            api.pushSeries(
                itemFromHub.slug,
                itemFromHub.cover,
                hubId,
                itemFromHub.data.url,
                seriesDetails.title
            ).catch(err => console.warn("Falha ao atualizar o histórico da série:", err));

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