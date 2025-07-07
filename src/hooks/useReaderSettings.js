import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './useUtils';

/**
 * Hook para gerenciar configurações persistentes e estado temporário do leitor.
 * AIDEV-NOTE: This hook centralizes all persistent and temporary reader settings.
 */
export const useReaderSettings = () => {
    // Configurações persistentes salvas no localStorage
    const [readingDirection, setReadingDirection] = useLocalStorage('reader-direction', 'ltr');
    const [readingMode, setReadingMode] = useLocalStorage('reader-mode', 'paginated');
    const [autoHideControls, setAutoHideControls] = useLocalStorage('reader-auto-hide-controls', true);
    const [preloadPagesCount, setPreloadPagesCount] = useLocalStorage('reader-preload-pages', 3); // AIDEV-NOTE: Preload 3 pages ahead by default

    // Estado temporário do componente
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);

    // Gerenciamento do modo de ecrã inteiro
    const toggleFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (error) {
            console.warn('Erro ao alternar ecrã inteiro:', error);
        }
    }, []);

    // Monitora mudanças no estado de ecrã inteiro
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Gerenciamento da visibilidade dos controlos
    const showControlsTemporarily = useCallback((duration = 3000) => {
        if (!autoHideControls) return;
        setShowControls(true);
        const timeoutId = setTimeout(() => setShowControls(false), duration);
        return () => clearTimeout(timeoutId);
    }, [autoHideControls]);

    return {
        readingDirection,
        setReadingDirection,
        readingMode,
        setReadingMode,
        autoHideControls,
        setAutoHideControls,
        preloadPagesCount,
        setPreloadPagesCount,
        isFullscreen,
        showControls,
        setShowControls,
        toggleFullscreen,
        showControlsTemporarily,
    };
};

/**
 * Hook para pré-carregar imagens de forma eficiente.
 * AIDEV-NOTE: Preloads images for upcoming pages to improve reader UX.
 */
export const useImagePreloader = (pages, currentPage, preloadCount = 3) => {
    useEffect(() => {
        if (!pages || pages.length === 0 || preloadCount === 0) return;

        // Pré-carrega as próximas 'preloadCount' páginas
        for (let i = 1; i <= preloadCount; i++) {
            const nextPage = currentPage + i;
            if (nextPage < pages.length) {
                const img = new Image();
                img.src = pages[nextPage];
            }
        }
        
        // Pré-carrega a página anterior para navegação fluida para trás
        const prevPage = currentPage - 1;
        if (prevPage >= 0) {
            const img = new Image();
            img.src = pages[prevPage];
        }

    }, [pages, currentPage, preloadCount]);
};

/**
 * Hook for reader navigation with RTL/LTR support
 * AIDEV-NOTE: Handles navigation logic for both reading directions
 */
export const useReaderNavigation = ({ 
    page, 
    setPage, 
    totalPages, 
    readingDirection, 
    onNextEntry, 
    onPrevEntry 
}) => {
    // AIDEV-NOTE: goToNextPage/PrevPage handle RTL/LTR logic and entry boundaries
    const goToNextPage = useCallback(() => {
        const isRtl = readingDirection === 'rtl';
        
        if (isRtl) {
            // In RTL, "next" is to the left (previous page)
            if (page > 0) {
                setPage(page - 1);
            } else {
                onPrevEntry?.();
            }
        } else {
            // In LTR, "next" is to the right (next page)
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
            // In RTL, "previous" is to the right (next page)
            if (page < totalPages - 1) {
                setPage(page + 1);
            } else {
                onNextEntry?.();
            }
        } else {
            // In LTR, "previous" is to the left (previous page)
            if (page > 0) {
                setPage(page - 1);
            } else {
                onPrevEntry?.();
            }
        }
    }, [page, totalPages, readingDirection, setPage, onNextEntry, onPrevEntry]);

    // AIDEV-NOTE: goToPage validates page boundaries
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
