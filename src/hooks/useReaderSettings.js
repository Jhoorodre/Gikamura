import { useState, useCallback, useEffect } from 'react';

// Hook personalizado para simular localStorage
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (_error) {
      console.error('Error saving to localStorage:', _error);
    }
  };

  return [storedValue, setValue];
};

/**
 * Hook para gerenciar configurações e estado do leitor
 * AIDEV-NOTE: This hook centralizes all persistent and temporary reader settings
 */
export const useReaderSettings = () => {
    // Persistent settings
    const [readingDirection, setReadingDirection] = useLocalStorage('reader-direction', 'ltr');
    const [readingMode, setReadingMode] = useLocalStorage('reader-mode', 'paginated');
    const [autoHideControls, setAutoHideControls] = useLocalStorage('reader-auto-hide-controls', true);
    const [preloadPages, setPreloadPages] = useLocalStorage('reader-preload-pages', 5);
    
    // Temporary state
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    
    // Fullscreen management
    // AIDEV-TODO: Consider supporting more browsers if needed
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
            console.warn('Error toggling fullscreen:', error); // AIDEV-NOTE: Error is non-blocking
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
            console.warn('Error exiting fullscreen:', error); // AIDEV-NOTE: Error is non-blocking
        }
    }, []);

    // Fullscreen change monitor
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

    // Controls management
    // AIDEV-NOTE: showControlsTemporarily is used to auto-hide UI controls after a delay
    const showControlsTemporarily = useCallback((duration = 4000) => {
        if (!autoHideControls) return;
        
        setShowControls(true);
        
        const timeoutId = setTimeout(() => {
            setShowControls(false);
        }, duration);
        
        return () => clearTimeout(timeoutId);
    }, [autoHideControls]);

    // Toggle reading direction
    // AIDEV-NOTE: Flips between 'ltr' and 'rtl' for reading direction
    const toggleReadingDirection = useCallback(() => {
        setReadingDirection(prev => prev === 'ltr' ? 'rtl' : 'ltr');
    }, [setReadingDirection]);

    // Toggle reading mode
    // AIDEV-NOTE: Flips between 'paginated' and 'scrolling' modes
    const toggleReadingMode = useCallback(() => {
        setReadingMode(prev => prev === 'paginated' ? 'scrolling' : 'paginated');
    }, [setReadingMode]);

    // Reset settings
    // AIDEV-TODO: Add reset for any new settings added in the future
    const resetSettings = useCallback(() => {
        setReadingDirection('ltr');
        setReadingMode('paginated');
        setAutoHideControls(true);
        setPreloadPages(5);
    }, [setReadingDirection, setReadingMode, setAutoHideControls, setPreloadPages]);

    return {
        // Settings
        readingDirection,
        setReadingDirection,
        readingMode,
        setReadingMode,
        autoHideControls,
        setAutoHideControls,
        preloadPages,
        setPreloadPages,
        
        // State
        isFullscreen,
        showControls,
        setShowControls,
        
        // Actions
        toggleFullscreen,
        exitFullscreen,
        showControlsTemporarily,
        toggleReadingDirection,
        toggleReadingMode,
        resetSettings
    };
};

/**
 * Hook for preloading images
 * AIDEV-NOTE: Preloads images for upcoming pages to improve reader UX
 */
export const useImagePreloader = (pages, currentPage, preloadCount = 5) => {
    const [preloadedImages, setPreloadedImages] = useState(new Set());
    const [loadingImages, setLoadingImages] = useState(new Set());

    // AIDEV-NOTE: Avoids reloading already loaded or loading images
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
                console.warn(`Failed to preload image ${index + 1}: ${url}`); // AIDEV-NOTE: Non-blocking image preload error
                reject();
            };
            
            img.src = url;
        });
    }, [preloadedImages, loadingImages]);

    // AIDEV-NOTE: Preloads a range of pages (forward and backward)
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
            console.warn('Some preloads failed:', error); // AIDEV-NOTE: Non-blocking preload error
        }
    }, [pages, preloadImage]);

    // Preload nearby pages when current page changes
    useEffect(() => {
        if (pages && pages.length > 0 && currentPage >= 0) {
            // Preload next pages
            preloadPages(currentPage + 1, preloadCount);
            // Preload some previous pages too
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
