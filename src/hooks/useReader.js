/**
 * Hook para gerenciar dados de obras (reader.json)
 * Integra com o serviço jsonReader e fornece estado reativo
 * AIDEV-NOTE: Central hook for all reader data and progress logic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loadReaderJSON, JSONUtils } from '../services/jsonReader.js';
import { remoteStorage } from '../services/remotestorage';
import { RS_PATH } from '../services/rs/rs-config.js';

const READING_PROGRESS_PATH = (RS_PATH && RS_PATH.READING_PROGRESS) ? RS_PATH.READING_PROGRESS : 'data/reading-progress/';

function safePath(path, fallback = 'data/reading-progress/') {
  return (typeof path === 'string' && path) ? path : fallback;
}

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
            if (!currentReaderUrl) {
                console.log('📖 [useReader] Não há URL para carregar');
                return null;
            }
            
            console.log('📖 [useReader] Carregando obra:', currentReaderUrl);
            try {
                const data = await loadReaderJSON(currentReaderUrl);
                console.log('📖 [useReader] Dados carregados:', data ? 'sucesso' : 'null');
                console.log('📖 [useReader] Capítulos encontrados:', data?.chapters ? Object.keys(data.chapters).length : 0);
                
                // Carrega progresso de leitura se conectado
                if (remoteStorage.connected) {
                    await loadReadingProgress(data);
                }
                
                return data;
            } catch (error) {
                console.error('❌ [useReader] Erro ao carregar dados:', error);
                throw error;
            }
        },
        enabled: !!currentReaderUrl,
        retry: 3,
        staleTime: 5 * 60 * 1000, // 5 minutos
        gcTime: 30 * 60 * 1000, // 30 minutos
    });

    // Função para carregar uma obra
    const loadReader = useCallback((url) => {
        console.log('🎯 [useReader] Definindo URL da obra:', url);
        console.log('🎯 [useReader] URL é válida?', !!url);
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
            // Usar false como maxAge para evitar cache
            const progressData = await remoteStorage.scope(safePath(READING_PROGRESS_PATH)).getObject('progress', workId, false);
            
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
        if (!remoteStorage.connected || !currentReaderUrl) {
            console.log('📚 [useReader] Progresso não salvo - RemoteStorage desconectado');
            return Promise.resolve(); // Retorna Promise resolvida quando não há conexão
        }

        try {
            const workId = generateWorkId(currentReaderUrl);
            
            // Criar o objeto de progresso conforme o schema
            const progressData = {
                // Campos obrigatórios do schema principal
                lastChapter: chapterId,
                lastUpdated: Date.now(),
                // Adicionar dados do capítulo atual
                [chapterId]: {
                    pageIndex: Number(pageIndex), // Garantir que seja número
                    totalPages: Number(totalPages), // Garantir que seja número
                    lastRead: Date.now(),
                    completed: pageIndex >= totalPages - 1
                }
            };

            // Se já existir progresso, mesclar com os dados existentes
            if (readingProgress && typeof readingProgress === 'object') {
                // Preservar dados de outros capítulos
                Object.keys(readingProgress).forEach(key => {
                    if (key !== 'lastChapter' && key !== 'lastUpdated' && key !== chapterId) {
                        progressData[key] = readingProgress[key];
                    }
                });
            }

            console.log('💾 [useReader] Objeto de progresso a ser salvo:', progressData);

            await remoteStorage.scope(safePath(READING_PROGRESS_PATH)).storeObject('progress', workId, progressData);
            setReadingProgress(progressData);
            
            console.log('✅ [useReader] Progresso salvo com sucesso:', { chapterId, pageIndex, totalPages });
        } catch (error) {
            console.error('❌ [useReader] Erro ao salvar progresso:', error);
            throw error; // Re-throw para manter comportamento de erro
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

    // Dados do capítulo selecionado
    const selectedChapterData = useMemo(() => {
        if (!selectedChapter || !readerData?.chapters?.[selectedChapter]) {
            console.log('🔍 [useReader] Debug - selectedChapter:', selectedChapter);
            console.log('🔍 [useReader] Debug - readerData?.chapters:', readerData?.chapters ? Object.keys(readerData.chapters) : 'undefined');
            return null;
        }
        
        const chapterData = { id: selectedChapter, ...readerData.chapters[selectedChapter] };
        
        // Extrai páginas do primeiro grupo disponível
        const groupKeys = Object.keys(chapterData.groups || {});
        const pages = groupKeys.length > 0 ? chapterData.groups[groupKeys[0]] : [];
        chapterData.pages = pages;
        
        console.log('🔍 [useReader] Debug - selectedChapterData:', chapterData);
        console.log('🔍 [useReader] Debug - páginas adicionadas:', pages.length);
        return chapterData;
    }, [selectedChapter, readerData]);

    return {
        // Estados
        readerData: processedData,
        isLoading: readerLoading,
        error: readerError,
        selectedChapter: selectedChapterData,
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
