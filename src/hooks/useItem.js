import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CORS_PROXY_URL } from '../constants';
import api from '../services/api.js';

export const useItem = () => {
    const [selection, setSelection] = useState(null);

    const {
        data: selectedItemData,
        isLoading: itemLoading,
        isError: hasItemError,
        error: itemError
    } = useQuery({
        queryKey: ['itemDetails', selection?.hubId, selection?.itemFromHub?.slug],
        queryFn: async () => {
            const { itemFromHub, hubId } = selection;
            if (!hubId || !itemFromHub?.data?.url) {
                throw new Error("Ficheiro do Hub (hub.json) está mal configurado. Falta a 'data.url' da série.");
            }
            const response = await fetch(`${CORS_PROXY_URL}${encodeURIComponent(itemFromHub.data.url)}`);
            if (!response.ok) throw new Error(`Erro ao buscar detalhes da série. Status: ${response.status}`);
            const seriesDetails = await response.json();
            const readChapters = await api.getReadChapters(itemFromHub.slug, hubId);
            api.pushSeries(
                itemFromHub.slug,
                itemFromHub.cover,
                hubId,
                itemFromHub.data.url,
                seriesDetails.title
            ).catch(err => console.warn("Falha ao atualizar o histórico da série:", err));
            return {
                ...itemFromHub,
                title: seriesDetails.title,
                description: seriesDetails.description,
                author: seriesDetails.author,
                entries: seriesDetails.chapters,
                sourceId: hubId,
                readChapterKeys: readChapters || [],
            };
        },
        enabled: !!selection,
        keepPreviousData: true,
    });

    const selectItem = useCallback((itemFromHub, hubId) => {
        setSelection({ itemFromHub, hubId });
    }, []);

    const clearSelectedItem = useCallback(() => {
        setSelection(null);
    }, []);

    return {
        loading: itemLoading,
        error: hasItemError ? itemError.message : null,
        selectItem,
        selectedItemData,
        clearSelectedItem
    };
};