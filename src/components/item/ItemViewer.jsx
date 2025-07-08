import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useReaderSettings, useImagePreloader } from '../../hooks/useReaderSettings';
import { ChevronLeftIcon, BookOpenIcon, ExpandIcon, ShrinkIcon } from '../common/Icones';
import Spinner from '../common/Spinner';
import Button from '../common/Button';
import Image from '../common/Image';

const ItemViewer = ({ 
    entry, 
    page = 0, 
    setPage, 
    onBack, 
    onNextEntry, 
    onPrevEntry, 
    isFirstEntry = false, 
    isLastEntry = false, 
    entryKey, 
    onSaveProgress 
}) => {
    // Hooks para gerir configurações e estado
    const {
        readingDirection,
        readingMode,
        setReadingMode,
        isFullscreen,
        toggleFullscreen,
        showControls,
        setShowControls,
        showControlsTemporarily,
        preloadPagesCount,
    } = useReaderSettings();

    const [lastSavedPage, setLastSavedPage] = useState(-1);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // AIDEV-NOTE: Stable mouse move handler to prevent listener accumulation
    const handleMouseMove = useCallback(() => setShowControls(true), [setShowControls]);
    
    // Mostrar controlos com movimento do rato
    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [handleMouseMove]);

    // Ocultar controlos automaticamente
    useEffect(() => {
        if (showControls) {
            return showControlsTemporarily();
        }
    }, [showControls, showControlsTemporarily]);
    
    // Extrai as páginas do capítulo
    const pages = useMemo(() => {
        if (!entry?.groups) return [];
        const groupKeys = Object.keys(entry.groups);
        if (groupKeys.length === 0) return [];
        return entry.groups[groupKeys[0]] || [];
    }, [entry]);

    const totalPages = pages.length;

    // Hook para pré-carregar imagens
    useImagePreloader(pages, page, preloadPagesCount);

    // Funções de navegação
    const goToPage = useCallback((newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setIsTransitioning(true);
            setTimeout(() => {
                setPage(newPage);
                setIsTransitioning(false);
            }, 150); // Metade da duração da transição para uma troca suave
        } else if (newPage < 0 && onPrevEntry && !isFirstEntry) {
            onPrevEntry();
        } else if (newPage >= totalPages && onNextEntry && !isLastEntry) {
            onNextEntry();
        }
    }, [totalPages, setPage, onNextEntry, onPrevEntry, isFirstEntry, isLastEntry]);
    
    const goToNextPage = useCallback(() => goToPage(page + 1), [page, goToPage]);
    const goToPrevPage = useCallback(() => goToPage(page - 1), [page, goToPage]);

    // AIDEV-NOTE: Stable keyboard handler to prevent listener accumulation
    const handleKeyPress = useCallback((e) => {
        if (e.key === 'ArrowLeft') readingDirection === 'rtl' ? goToNextPage() : goToPrevPage();
        else if (e.key === 'ArrowRight') readingDirection === 'rtl' ? goToPrevPage() : goToNextPage();
        else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
        else if (e.key === 'Escape' && isFullscreen) document.exitFullscreen();
    }, [goToNextPage, goToPrevPage, readingDirection, isFullscreen, toggleFullscreen]);
    
    // Controlos de teclado
    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handleKeyPress]);

    // Salvar progresso
    useEffect(() => {
        if (onSaveProgress && page !== lastSavedPage && totalPages > 0) {
            const timeoutId = setTimeout(() => {
                onSaveProgress(page).then(() => setLastSavedPage(page)).catch(console.error);
            }, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [page, lastSavedPage, onSaveProgress, totalPages]); // AIDEV-NOTE: Removed entryKey dependency to prevent unnecessary re-runs

    if (!pages || totalPages === 0) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-center text-gray-400 p-4">
                <div>
                    <BookOpenIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h2 className="text-lg text-white mb-2">Nenhuma página encontrada</h2>
                    <p className="mb-4">Este capítulo parece estar vazio ou os dados estão corrompidos.</p>
                    {onBack && <Button onClick={onBack} variant="primary">Voltar</Button>}
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-black min-h-screen text-white select-none ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
            {/* Header com controlos */}
            <div className={`fixed top-0 left-0 right-0 z-30 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="flex items-center justify-between p-3 bg-black/70 backdrop-blur-sm">
                    <Button onClick={onBack} variant="ghost" className="text-gray-300 hover:text-white px-2 py-1 text-sm"><ChevronLeftIcon className="w-4 h-4 mr-1" /> Voltar</Button>
                    <div className="flex items-center gap-4 text-sm text-white">
                        <span>{page + 1} / {totalPages}</span>
                        <Button onClick={() => setReadingMode(readingMode === 'paginated' ? 'scroll' : 'paginated')} variant="ghost" className="text-gray-300 hover:text-white px-2 py-1 text-xs">{readingMode === 'paginated' ? 'Scroll' : 'Páginas'}</Button>
                    </div>
                    <Button onClick={toggleFullscreen} variant="ghost" className="text-gray-300 hover:text-white px-2 py-1">{isFullscreen ? <ShrinkIcon className="w-4 h-4" /> : <ExpandIcon className="w-4 h-4" />}</Button>
                </div>
            </div>

            {/* Conteúdo do Leitor */}
            <div className="h-screen w-screen flex items-center justify-center overflow-hidden">
                {readingMode === 'paginated' ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                        {/* Áreas de Navegação */}
                        <div className="absolute left-0 top-0 w-1/3 h-full z-20" onClick={readingDirection === 'rtl' ? goToNextPage : goToPrevPage} />
                        <div className="absolute right-0 top-0 w-1/3 h-full z-20" onClick={readingDirection === 'rtl' ? goToPrevPage : goToNextPage} />
                        
                        {/* Imagem com Transição */}
                        <Suspense fallback={<Spinner />}>
                            <div className={`w-full h-full flex items-center justify-center transition-opacity duration-300 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                                <Image
                                    src={pages[page]}
                                    alt={`Página ${page + 1}`}
                                    className="max-w-full max-h-full object-contain"
                                    loading="eager" // A imagem principal deve carregar rapidamente
                                />
                            </div>
                        </Suspense>
                    </div>
                ) : (
                    // Modo Scroll
                    <div className="w-full h-full overflow-y-auto pt-16 pb-4">
                        <div className="max-w-3xl mx-auto space-y-2 px-2">
                            {pages.map((url, index) => (
                                <Suspense key={index} fallback={<div className="w-full h-96 bg-gray-800 rounded-md animate-pulse" />}>
                                    <Image src={url} alt={`Página ${index + 1}`} className="w-full max-w-full rounded" loading={index > 2 ? "lazy" : "eager"} />
                                </Suspense>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ItemViewer;
