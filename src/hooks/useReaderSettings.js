import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useUtils';

/**
 * Hook para gerenciar configurações e estado do leitor
 */
export const useReaderSettings = () => {
    // Configurações persistentes
    const [readingDirection, setReadingDirection] = useLocalStorage('reader-direction', 'ltr');
    const [readingMode, setReadingMode] = useLocalStorage('reader-mode', 'paginated');
    const [autoHideControls, setAutoHideControls] = useLocalStorage('reader-auto-hide-controls', true);
    const [preloadPages, setPreloadPages] = useLocalStorage('reader-preload-pages', 5);
    
    // Estado temporário
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    
    // Gerenciamento de fullscreen
    const toggleFullscreen = useCallback(async () => {
        try {
            if (!isFullscreen) {
                await (
                    document.documentElement.requestFullscreen?.() ||
                    document.documentElement.webkitRequestFullscreen?.() ||
                    document.documentElement.msRequestFullscreen?.()
                );
            } else {
                await (
                    document.exitFullscreen?.() ||
                    document.webkitExitFullscreen?.() ||
                    document.msExitFullscreen?.()
                );
            }
        } catch (error) {
            console.warn('Erro ao alternar fullscreen:', error);
        }
    }, [isFullscreen]);

    const exitFullscreen = useCallback(async () => {
        try {
            await (
                document.exitFullscreen?.() ||
                document.webkitExitFullscreen?.() ||
                document.msExitFullscreen?.()
            );
        } catch (error) {
            console.warn('Erro ao sair do fullscreen:', error);
        }
    }, []);

    // Monitor de mudanças de fullscreen
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        
        const events = ['fullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange'];
        events.forEach(event => {
            document.addEventListener(event, handleFullscreenChange);
        });
        
        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleFullscreenChange);
            });
        };
    }, []);

    // Gerenciamento de controles
    const showControlsTemporarily = useCallback((duration = 4000) => {
        if (!autoHideControls) return;
        
        setShowControls(true);
        
        const timeoutId = setTimeout(() => {
            setShowControls(false);
        }, duration);
        
        return () => clearTimeout(timeoutId);
    }, [autoHideControls]);

    // Alternar direção de leitura
    const toggleReadingDirection = useCallback(() => {
        setReadingDirection(prev => prev === 'ltr' ? 'rtl' : 'ltr');
    }, [setReadingDirection]);

    // Alternar modo de leitura
    const toggleReadingMode = useCallback(() => {
        setReadingMode(prev => prev === 'paginated' ? 'scrolling' : 'paginated');
    }, [setReadingMode]);

    // Resetar configurações
    const resetSettings = useCallback(() => {
        setReadingDirection('ltr');
        setReadingMode('paginated');
        setAutoHideControls(true);
        setPreloadPages(5);
    }, [setReadingDirection, setReadingMode, setAutoHideControls, setPreloadPages]);

    return {
        // Configurações
        readingDirection,
        setReadingDirection,
        readingMode,
        setReadingMode,
        autoHideControls,
        setAutoHideControls,
        preloadPages,
        setPreloadPages,
        
        // Estado
        isFullscreen,
        showControls,
        setShowControls,
        
        // Ações
        toggleFullscreen,
        exitFullscreen,
        showControlsTemporarily,
        toggleReadingDirection,
        toggleReadingMode,
        resetSettings
    };
};

/**
 * Hook para pré-carregamento de imagens
 */
export const useImagePreloader = (pages, currentPage, preloadCount = 5) => {
    const [preloadedImages, setPreloadedImages] = useState(new Set());
    const [loadingImages, setLoadingImages] = useState(new Set());

    const preloadImage = useCallback((url, index) => {
        if (preloadedImages.has(index) || loadingImages.has(index)) {
            return Promise.resolve();
        }

        setLoadingImages(prev => new Set(prev).add(index));

        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                setPreloadedImages(prev => new Set(prev).add(index));
                setLoadingImages(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(index);
                    return newSet;
                });
                resolve();
            };
            
            img.onerror = () => {
                setLoadingImages(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(index);
                    return newSet;
                });
                console.warn(`Falha ao pré-carregar imagem ${index + 1}: ${url}`);
                reject();
            };
            
            img.src = url;
        });
    }, [preloadedImages, loadingImages]);

    const preloadPages = useCallback(async (startIndex, count) => {
        if (!pages || pages.length === 0) return;

        const promises = [];
        for (let i = startIndex; i < Math.min(startIndex + count, pages.length); i++) {
            if (i >= 0 && pages[i]) {
                promises.push(preloadImage(pages[i], i));
            }
        }

        try {
            await Promise.allSettled(promises);
        } catch (error) {
            console.warn('Alguns pré-carregamentos falharam:', error);
        }
    }, [pages, preloadImage]);

    // Pré-carrega páginas próximas quando a página atual muda
    useEffect(() => {
        if (pages && pages.length > 0 && currentPage >= 0) {
            // Pré-carrega páginas seguintes
            preloadPages(currentPage + 1, preloadCount);
            
            // Pré-carrega algumas páginas anteriores também
            preloadPages(Math.max(0, currentPage - 2), 2);
        }
    }, [currentPage, pages, preloadCount, preloadPages]);

    return {
        preloadedImages,
        loadingImages,
        isPagePreloaded: (index) => preloadedImages.has(index),
        isPageLoading: (index) => loadingImages.has(index),
        preloadPages
    };
};

/**
 * Hook para navegação do leitor com suporte a RTL/LTR
 */
export const useReaderNavigation = ({ 
    page, 
    setPage, 
    totalPages, 
    readingDirection, 
    onNextEntry, 
    onPrevEntry 
}) => {
    const goToNextPage = useCallback(() => {
        const isRtl = readingDirection === 'rtl';
        
        if (isRtl) {
            // Em RTL, "próxima" é para a esquerda (página anterior)
            if (page > 0) {
                setPage(page - 1);
            } else {
                onPrevEntry?.();
            }
        } else {
            // Em LTR, "próxima" é para a direita (página seguinte)
            if (page < totalPages - 1) {
                setPage(page + 1);
            } else {
                onNextEntry?.();
            }
        }
    }, [page, totalPages, readingDirection, setPage, onNextEntry, onPrevEntry]);

    const goToPrevPage = useCallback(() => {
        const isRtl = readingDirection === 'rtl';
        
        if (isRtl) {
            // Em RTL, "anterior" é para a direita (página seguinte)
            if (page < totalPages - 1) {
                setPage(page + 1);
            } else {
                onNextEntry?.();
            }
        } else {
            // Em LTR, "anterior" é para a esquerda (página anterior)
            if (page > 0) {
                setPage(page - 1);
            } else {
                onPrevEntry?.();
            }
        }
    }, [page, totalPages, readingDirection, setPage, onNextEntry, onPrevEntry]);

    const goToPage = useCallback((pageNumber) => {
        if (pageNumber >= 0 && pageNumber < totalPages) {
            setPage(pageNumber);
        }
    }, [totalPages, setPage]);

    return {
        goToNextPage,
        goToPrevPage,
        goToPage,
        canGoNext: readingDirection === 'rtl' ? page > 0 : page < totalPages - 1,
        canGoPrev: readingDirection === 'rtl' ? page < totalPages - 1 : page > 0
    };
};
