/**
 * Hook para gerenciar dados de obras (reader.json)
 * Integra com o serviço jsonReader e fornece estado reativo
 * AIDEV-NOTE: Central hook for all reader data, progress, and chapter management
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loadReaderJSON, JSONUtils } from '../services/jsonReader.js';
import { remoteStorage } from '../services/remotestorage';
import { RS_PATH } from '../services/rs/rs-config.js';

const READING_PROGRESS_PATH = (RS_PATH && RS_PATH.READING_PROGRESS) ? RS_PATH.READING_PROGRESS : 'data/reading-progress/';

// AIDEV-NOTE: Safe path fallback for RemoteStorage operations
function safePath(path, fallback = 'data/reading-progress/') {
  return (typeof path === 'string' && path) ? path : fallback;
}

export const useReader = () => {
    const [currentReaderUrl, setCurrentReaderUrl] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [readingProgress, setReadingProgress] = useState({}); // AIDEV-NOTE: Tracks user reading progress per chapter
    const [saveError, setSaveError] = useState(null);

    // AIDEV-NOTE: React Query for reader data with progress loading integration
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
                
                // AIDEV-NOTE: Load reading progress if connected to RemoteStorage
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
            // AIDEV-NOTE: Chamada correta para getObject no escopo: apenas o caminho (workId) deve ser passado
            const progressData = await remoteStorage.scope(safePath(READING_PROGRESS_PATH)).getObject(workId);
            
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
            return Promise.resolve();
        }

        try {
            const workId = generateWorkId(currentReaderUrl);

            // AIDEV-NOTE: Cria objeto de progresso conforme schema, sanitizando dados antigos
            const progressData = {
                lastChapter: chapterId,
                lastUpdated: Date.now(),
                [chapterId]: {
                    pageIndex: Number(pageIndex),
                    totalPages: Number(totalPages),
                    lastRead: Date.now(),
                    completed: pageIndex >= totalPages - 1
                }
            };

            // Mesclar progresso antigo, mas só copiar capítulos válidos
            if (readingProgress && typeof readingProgress === 'object') {
                Object.keys(readingProgress).forEach(key => {
                    if (
                        key !== 'lastChapter' &&
                        key !== 'lastUpdated' &&
                        key !== chapterId &&
                        typeof readingProgress[key] === 'object'
                    ) {
                        const old = readingProgress[key];
                        // AIDEV-NOTE: Sanitiza cada capítulo antigo
                        if (
                            typeof old.pageIndex === 'number' &&
                            typeof old.totalPages === 'number' &&
                            typeof old.lastRead === 'number' &&
                            typeof old.completed === 'boolean'
                        ) {
                            progressData[key] = {
                                pageIndex: old.pageIndex,
                                totalPages: old.totalPages,
                                lastRead: old.lastRead,
                                completed: old.completed
                            };
                        }
                    }
                });
            }

            console.log('💾 [useReader] Objeto de progresso a ser salvo (sanitizado):', progressData);

            // AIDEV-NOTE: Limpeza de propriedades inválidas do objeto de progresso antes de salvar
            function cleanProgressData(progressData) {
                const allowedRoot = ['lastChapter', 'lastUpdated'];
                const allowedChapterFields = ['pageIndex', 'totalPages', 'lastRead', 'completed'];
                const cleaned = {};
                let removed = [];
                for (const key of Object.keys(progressData)) {
                    if (!Object.prototype.hasOwnProperty.call(progressData, key)) continue;
                    if (allowedRoot.includes(key)) {
                        cleaned[key] = progressData[key];
                    } else if (key === '@context') {
                        removed.push(key);
                    } else if (
                        typeof progressData[key] === 'object' &&
                        progressData[key] !== null &&
                        allowedChapterFields.every(f => f in progressData[key])
                    ) {
                        cleaned[key] = progressData[key];
                    } else {
                        removed.push(key);
                    }
                }
                if (removed.length > 0) {
                    console.warn('⚠️ [useReader] Removendo campos inválidos do progresso antes de salvar:', removed);
                }
                return cleaned;
            }

            // AIDEV-NOTE: Remove recursivamente qualquer campo '@context' de qualquer nível do objeto
            function deepRemoveContext(obj) {
                if (Array.isArray(obj)) {
                    return obj.map(deepRemoveContext);
                } else if (obj && typeof obj === 'object') {
                    const cleaned = {};
                    for (const key of Object.keys(obj)) {
                        if (key !== '@context') {
                            cleaned[key] = deepRemoveContext(obj[key]);
                        }
                    }
                    return cleaned;
                }
                return obj;
            }

            // Antes de salvar:
            const cleanedProgress = cleanProgressData(progressData);
            const finalProgress = deepRemoveContext(cleanedProgress);
            // Log para debug
            console.log('💾 [useReader] Objeto de progresso FINAL a ser salvo (limpo):', finalProgress);
            console.log('🔑 [useReader] Chaves do objeto de progresso limpo:', Object.keys(finalProgress));

            await remoteStorage.scope(safePath(READING_PROGRESS_PATH)).storeObject('progress', workId, finalProgress);
            setReadingProgress(finalProgress);
            setSaveError(null);
            
            console.log('✅ [useReader] Progresso salvo com sucesso:', { chapterId, pageIndex, totalPages });
        } catch (error) {
            setSaveError("Não foi possível salvar seu progresso. Verifique sua conexão.");
            // AIDEV-NOTE: Log detalhado do erro do RemoteStorage ao salvar progresso
            if (error && typeof error === 'object') {
                console.error('❌ [useReader] Erro ao salvar progresso:', error);
                if (typeof error.toString === 'function') {
                    console.error('⛔ [useReader] error.toString():', error.toString());
                }
                if (error.stack) {
                    console.error('⛔ [useReader] error.stack:', error.stack);
                }
                Object.keys(error).forEach(key => {
                    if (key !== 'stack' && key !== 'toString') {
                        console.error(`⛔ [useReader] error[${key}]:`, error[key]);
                    }
                });
            } else {
                console.error('❌ [useReader] Erro ao salvar progresso (não-objeto):', error);
            }
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
        saveError,

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
