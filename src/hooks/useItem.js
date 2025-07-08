/**
 * Hook para manipulação de itens (obras, capítulos, etc)
 * AIDEV-NOTE: Handles item state, selection and actions
 */

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchJSONWithCache } from '../services/networkService.js';
import api from '../services/api.js';
import { remoteStorage } from '../services/remotestorage.js';

export const useItem = () => {
    const [selection, setSelection] = useState(null);

    const {
        data: selectedItemData,
        isLoading: itemLoading,
        isError: hasItemError,
        error: itemError,
        refetch: refetchItem
    } = useQuery({
        queryKey: ['itemDetails', selection?.hubId, selection?.itemFromHub?.slug],
        queryFn: async () => {
            const { itemFromHub, hubId } = selection;
            if (!hubId || !itemFromHub?.data?.url) {
                throw new Error("Ficheiro do Hub (hub.json) está mal configurado. Falta a 'data.url' da série.");
            }
            
            try {
                const seriesDetails = await fetchJSONWithCache(itemFromHub.data.url);
                const readChapters = await api.getReadChapters(itemFromHub.slug, hubId);
                
                // Atualiza histórico em background (somente se conectado)
                if (remoteStorage.connected) {
                    api.pushSeries(
                        itemFromHub.slug,
                        typeof itemFromHub.cover === 'string' ? itemFromHub.cover : itemFromHub.cover?.url || '',
                        hubId,
                        itemFromHub.data.url,
                        seriesDetails.title
                    ).catch(err => console.warn("Falha ao atualizar o histórico da série:", err));
                } else {
                    console.log('📚 [useItem] RemoteStorage não conectado - não salvando histórico');
                }
                
                return {
                    ...itemFromHub,
                    title: seriesDetails.title,
                    description: seriesDetails.description,
                    author: seriesDetails.author,
                    entries: seriesDetails.chapters,
                    sourceId: hubId,
                    readChapterKeys: readChapters || [],
                };
            } catch (error) {
                console.error('[useItem] Erro ao carregar detalhes:', error);
                throw new Error(`Falha ao carregar detalhes da série: ${error.message}`);
            }
        },
        enabled: !!selection,
        keepPreviousData: true,
        retry: (failureCount, error) => {
            // Retry até 3 vezes para erros de rede
            if (failureCount < 3) {
                const retryableErrors = ['network', 'timeout', 'fetch'];
                return retryableErrors.some(keyword => 
                    error.message.toLowerCase().includes(keyword)
                );
            }
            return false;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        staleTime: 2 * 60 * 1000, // 2 minutos
        gcTime: 5 * 60 * 1000, // 5 minutos
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
        clearSelectedItem,
        refetchItem // Nova função para retry manual
    };
};