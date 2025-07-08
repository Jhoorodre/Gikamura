// src/hooks/useImageCache.js - Sistema de Cache Inteligente para Imagens
import { useState, useEffect, useCallback, useRef } from 'react';

const useImageCache = () => {
    const [cache, setCache] = useState(new Map());
    const [preloadQueue, setPreloadQueue] = useState([]);
    const [isPreloading, setIsPreloading] = useState(false);
    const preloadWorkerRef = useRef(null);
    const maxCacheSize = useRef(100); // Máximo de imagens em cache
    const preloadBatchSize = useRef(3); // Carregar 3 imagens por vez
    
    // AIDEV-NOTE: Track component mount status to prevent memory leaks
    const isMountedRef = useRef(true);
    const pendingLoads = useRef(new Set()); // Track pending image loads
    
    // AIDEV-NOTE: Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            // Cancel all pending image loads
            pendingLoads.current.clear();
        };
    }, []);

    // Limpar cache antigo baseado no LRU (Least Recently Used)
    const cleanCache = useCallback(() => {
        setCache(currentCache => {
            if (currentCache.size >= maxCacheSize.current) {
                const entries = Array.from(currentCache.entries());
                entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);
                
                // Remove os 20% mais antigos
                const toRemove = Math.floor(entries.length * 0.2);
                const newCache = new Map(currentCache);
                for (let i = 0; i < toRemove; i++) {
                    newCache.delete(entries[i][0]);
                }
                return newCache;
            }
            return currentCache;
        });
    }, []);

    // Adicionar imagem ao cache
    const addToCache = useCallback((url, imageData) => {
        setCache(currentCache => {
            // Limpar se necessário
            let newCache = currentCache;
            if (currentCache.size >= maxCacheSize.current) {
                const entries = Array.from(currentCache.entries());
                entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);
                const toRemove = Math.floor(entries.length * 0.2);
                newCache = new Map(currentCache);
                for (let i = 0; i < toRemove; i++) {
                    newCache.delete(entries[i][0]);
                }
            } else {
                newCache = new Map(currentCache);
            }
            
            newCache.set(url, {
                data: imageData,
                lastAccess: Date.now(),
                status: 'loaded'
            });
            return newCache;
        });
    }, []);

    // Marcar imagem como acessada (para LRU)
    const markAsAccessed = useCallback((url) => {
        setCache(currentCache => {
            if (currentCache.has(url)) {
                const entry = currentCache.get(url);
                entry.lastAccess = Date.now();
                const newCache = new Map(currentCache);
                newCache.set(url, entry);
                return newCache;
            }
            return currentCache;
        });
    }, []);

    // Pré-carregar uma única imagem
    const preloadImage = useCallback((url) => {
        return new Promise((resolve, reject) => {
            // AIDEV-NOTE: Check if component is still mounted
            if (!isMountedRef.current) {
                reject(new Error('Component unmounted'));
                return;
            }
            
            // Verificar cache atual
            setCache(currentCache => {
                if (currentCache.has(url)) {
                    const entry = currentCache.get(url);
                    entry.lastAccess = Date.now();
                    const newCache = new Map(currentCache);
                    newCache.set(url, entry);
                    resolve(entry.data);
                    return newCache;
                }
                
                // AIDEV-NOTE: Track this load to allow cancellation
                pendingLoads.current.add(url);
                
                // Carregar nova imagem
                const img = new Image();
                img.onload = () => {
                    // AIDEV-NOTE: Check if still mounted and not cancelled
                    if (isMountedRef.current && pendingLoads.current.has(url)) {
                        pendingLoads.current.delete(url);
                        addToCache(url, img);
                        resolve(img);
                    } else {
                        // AIDEV-NOTE: Clean up image handlers to prevent memory leaks
                        img.onload = null;
                        img.onerror = null;
                        img.src = '';
                        reject(new Error('Load cancelled'));
                    }
                };
                img.onerror = () => {
                    if (isMountedRef.current && pendingLoads.current.has(url)) {
                        pendingLoads.current.delete(url);
                        // AIDEV-NOTE: Clean up image handlers
                        img.onload = null;
                        img.onerror = null;
                        img.src = '';
                        reject(new Error(`Falha ao carregar: ${url}`));
                    }
                };
                img.src = url;
                
                return currentCache;
            });
        });
    }, [addToCache]);

    // Worker para pré-carregamento em lotes
    const processPreloadQueue = useCallback(async () => {
        if (isPreloading || preloadQueue.length === 0 || !isMountedRef.current) return;
        
        setIsPreloading(true);
        
        try {
            const batch = preloadQueue.slice(0, preloadBatchSize.current);
            const remaining = preloadQueue.slice(preloadBatchSize.current);
            
            // AIDEV-NOTE: Only update state if component is still mounted
            if (isMountedRef.current) {
                setPreloadQueue(remaining);
            }
            
            // Carregar em paralelo o lote atual
            await Promise.allSettled(
                batch.map(url => preloadImage(url))
            );
            
            // AIDEV-NOTE: Check if component is still mounted before continuing
            if (!isMountedRef.current) return;
            
            // Pequena pausa para não sobrecarregar
            await new Promise(resolve => {
                const timer = setTimeout(resolve, 100);
                // AIDEV-NOTE: Clear timeout if component unmounts
                if (!isMountedRef.current) {
                    clearTimeout(timer);
                }
            });
            
        } catch (error) {
            if (isMountedRef.current) {
                console.warn('Erro no pré-carregamento:', error);
            }
        } finally {
            if (isMountedRef.current) {
                setIsPreloading(false);
            }
        }
    }, [isPreloading, preloadQueue, preloadImage]);

    // Efeito para processar fila de pré-carregamento
    useEffect(() => {
        if (preloadQueue.length > 0 && !isPreloading && isMountedRef.current) {
            const timer = setTimeout(() => {
                // AIDEV-NOTE: Double-check component is still mounted before processing
                if (isMountedRef.current) {
                    processPreloadQueue();
                }
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [preloadQueue, isPreloading, processPreloadQueue]);

    // Adicionar URLs à fila de pré-carregamento
    const addToPreloadQueue = useCallback((urls) => {
        setPreloadQueue(currentQueue => {
            const newUrls = urls.filter(url => !currentQueue.includes(url));
            return newUrls.length > 0 ? [...currentQueue, ...newUrls] : currentQueue;
        });
    }, []);

    // Pré-carregar páginas do capítulo atual e próximo
    const preloadChapterPages = useCallback((currentPages, currentPageIndex, nextChapterPages = []) => {
        const pagesToPreload = [];
        
        // Próximas 5 páginas do capítulo atual
        const nextPages = currentPages.slice(
            currentPageIndex + 1, 
            currentPageIndex + 6
        );
        pagesToPreload.push(...nextPages);
        
        // Se está nas últimas 3 páginas, pré-carregar próximo capítulo
        if (currentPageIndex >= currentPages.length - 3 && nextChapterPages.length > 0) {
            const nextChapterPreload = nextChapterPages.slice(0, 5);
            pagesToPreload.push(...nextChapterPreload);
        }
        
        addToPreloadQueue(pagesToPreload);
    }, [addToPreloadQueue]);

    // Pré-carregar capítulo específico
    const preloadChapter = useCallback((chapterPages, priority = false) => {
        if (priority) {
            // Adicionar no início da fila para alta prioridade
            const newUrls = chapterPages.filter(url => 
                !cache.has(url) && 
                !preloadQueue.includes(url)
            );
            setPreloadQueue(prev => [...newUrls, ...prev]);
        } else {
            addToPreloadQueue(chapterPages);
        }
    }, [cache, preloadQueue, addToPreloadQueue]);

    // Obter imagem do cache ou carregar
    const getImage = useCallback(async (url) => {
        // Tentar do cache primeiro
        const cached = cache.get(url);
        if (cached) {
            markAsAccessed(url);
            return cached.data;
        }
        
        try {
            return await preloadImage(url);
        } catch (error) {
            console.error('Erro ao carregar imagem:', error);
            throw error;
        }
    }, [cache, markAsAccessed, preloadImage]);

    // Verificar se imagem está em cache
    const isImageCached = useCallback((url) => {
        return cache.has(url);
    }, [cache]);

    // Limpar cache manualmente
    const clearCache = useCallback(() => {
        setCache(new Map());
        setPreloadQueue([]);
    }, []);

    // Estatísticas do cache
    const getCacheStats = useCallback(() => {
        return {
            size: cache.size,
            maxSize: maxCacheSize.current,
            queueSize: preloadQueue.length,
            isPreloading,
            usagePercentage: Math.round((cache.size / maxCacheSize.current) * 100)
        };
    }, [cache.size, preloadQueue.length, isPreloading]);

    return {
        // Funções principais
        getImage,
        preloadChapterPages,
        preloadChapter,
        isImageCached,
        
        // Utilities
        clearCache,
        getCacheStats,
        
        // Estados
        isPreloading,
        cacheSize: cache.size
    };
};

export default useImageCache;