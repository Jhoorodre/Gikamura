/**
 * Hook para gerenciar dados de obras (reader.json)
 * Integra com o serviço jsonReader e fornece estado reativo
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loadReaderJSON, JSONUtils } from '../services/jsonReader.js';
import { remoteStorage } from '../services/remotestorage';
import { RS_PATH } from '../services/rs/rs-config.js';

export const useReader = () => {
    const [currentReaderUrl, setCurrentReaderUrl] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [readingProgress, setReadingProgress] = useState({});

    // Query para carregar dados da obra
    const {
        data: readerData,
        isLoading: readerLoading,
        error: readerError,
        refetch: refetchReader
    } = useQuery({
        queryKey: ['reader', currentReaderUrl],
        queryFn: async () => {
            if (!currentReaderUrl) return null;
            
            console.log('📖 [useReader] Carregando obra:', currentReaderUrl);
            const data = await loadReaderJSON(currentReaderUrl);
            
            // Carrega progresso de leitura se conectado
            if (remoteStorage.connected) {
                await loadReadingProgress(data);
            }
            
            return data;
        },
        enabled: !!currentReaderUrl,
        retry: 3,
        staleTime: 5 * 60 * 1000, // 5 minutos
        cacheTime: 30 * 60 * 1000, // 30 minutos
    });

    // Função para carregar uma obra
    const loadReader = useCallback((url) => {
        console.log('🎯 [useReader] Definindo URL da obra:', url);
        setCurrentReaderUrl(url);
        setSelectedChapter(null);
    }, []);

    // Função para selecionar capítulo
    const selectChapter = useCallback((chapterId) => {
        console.log('📄 [useReader] Selecionando capítulo:', chapterId);
        setSelectedChapter(chapterId);
    }, []);

    // Carrega progresso de leitura do RemoteStorage
    const loadReadingProgress = useCallback(async (data) => {
        if (!remoteStorage.connected || !data) return;

        try {
            const workId = generateWorkId(currentReaderUrl);
            const progressData = await remoteStorage.scope(RS_PATH.READING_PROGRESS).getObject(workId);
            
            if (progressData) {
                setReadingProgress(progressData);
                console.log('📚 [useReader] Progresso carregado:', progressData);
            }
        } catch (error) {
            console.warn('⚠️ [useReader] Erro ao carregar progresso:', error);
        }
    }, [currentReaderUrl]);

    // Salva progresso de leitura
    const saveReadingProgress = useCallback(async (chapterId, pageIndex, totalPages) => {
        if (!remoteStorage.connected || !currentReaderUrl) return;

        try {
            const workId = generateWorkId(currentReaderUrl);
            const progressData = {
                ...readingProgress,
                [chapterId]: {
                    pageIndex,
                    totalPages,
                    lastRead: Date.now(),
                    completed: pageIndex >= totalPages - 1
                },
                lastChapter: chapterId,
                lastUpdated: Date.now()
            };

            await remoteStorage.scope(RS_PATH.READING_PROGRESS).storeObject('reading-progress', workId, progressData);
            setReadingProgress(progressData);
            
            console.log('💾 [useReader] Progresso salvo:', { chapterId, pageIndex, totalPages });
        } catch (error) {
            console.error('❌ [useReader] Erro ao salvar progresso:', error);
        }
    }, [currentReaderUrl, readingProgress]);

    // Marca capítulo como lido
    const markChapterAsRead = useCallback(async (chapterId) => {
        if (!readerData?.chapters?.[chapterId]) return;

        const chapter = readerData.chapters[chapterId];
        const totalPages = Object.values(chapter.groups || {}).flat().length;
        
        await saveReadingProgress(chapterId, totalPages - 1, totalPages);
    }, [readerData, saveReadingProgress]);

    // Utilitários para dados processados
    const processedData = readerData ? {
        ...readerData,
        
        // Lista de capítulos ordenada com informações processadas
        chapterList: readerData._metadata?.chapterKeys?.map(key => ({
            ...JSONUtils.getChapterInfo(readerData.chapters[key], key),
            progress: readingProgress[key],
            isRead: readingProgress[key]?.completed || false
        })) || [],

        // Capítulo atualmente selecionado
        currentChapter: selectedChapter ? {
            ...JSONUtils.getChapterInfo(readerData.chapters[selectedChapter], selectedChapter),
            pages: Object.values(readerData.chapters[selectedChapter]?.groups || {}).flat(),
            progress: readingProgress[selectedChapter]
        } : null,

        // Estatísticas gerais
        stats: {
            totalChapters: readerData._metadata?.totalChapters || 0,
            readChapters: Object.values(readingProgress).filter(p => p.completed).length,
            lastChapter: readerData._metadata?.lastChapter,
            lastUpdated: JSONUtils.formatTimestamp(readerData._metadata?.lastUpdated)
        }
    } : null;

    return {
        // Estados
        readerData: processedData,
        isLoading: readerLoading,
        error: readerError,
        selectedChapter,
        readingProgress,

        // Ações
        loadReader,
        selectChapter,
        saveReadingProgress,
        markChapterAsRead,
        refetchReader,

        // Utilitários
        utils: JSONUtils
    };
};

/**
 * Gera ID único para a obra baseado na URL
 */
function generateWorkId(url) {
    if (!url) return null;
    
    // Usa hash simples da URL para criar ID consistente
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
        const char = url.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Converte para 32bit
    }
    
    return `work_${Math.abs(hash).toString(36)}`;
}

export default useReader;
