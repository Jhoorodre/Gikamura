import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ExpandIcon, ShrinkIcon, BookOpenIcon, SettingsIcon } from '../common/Icones';
import Spinner from '../common/Spinner';
import ErrorMessage from '../common/ErrorMessage';
import Image from '../common/Image';
import Button from '../common/Button';

const ItemViewer = ({ 
    entry, 
    page = 0, 
    setPage, 
    onBack, 
    readingMode = 'paginated', 
    setReadingMode, 
    onNextEntry, 
    onPrevEntry, 
    isFirstEntry = false, 
    isLastEntry = false, 
    itemData, 
    entryKey, 
    onSaveProgress 
}) => {
    // Estados locais
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [readingDirection, setReadingDirection] = useState('ltr'); // ltr ou rtl
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastSavedPage, setLastSavedPage] = useState(-1);

    // Auto-hide dos controles
    useEffect(() => {
        let timeout;
        if (showControls) {
            timeout = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
        return () => clearTimeout(timeout);
    }, [showControls]);

    // Mostrar controles no movimento do mouse
    useEffect(() => {
        const handleMouseMove = () => {
            setShowControls(true);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Extrair páginas do capítulo
    const pages = useMemo(() => {
        if (!entry?.groups) return [];
        
        const groupKeys = Object.keys(entry.groups);
        if (groupKeys.length === 0) return [];
        
        const extractedPages = entry.groups[groupKeys[0]] || [];
        console.log('🖼️ [ItemViewer] Páginas extraídas:', extractedPages.length);
        return extractedPages;
    }, [entry]);

    const totalPages = pages.length;

    // Navegação entre páginas
    const goToNextPage = useCallback(() => {
        if (readingMode === 'paginated') {
            if (page < totalPages - 1) {
                setPage(page + 1);
            } else if (onNextEntry && !isLastEntry) {
                onNextEntry();
            }
        }
    }, [page, totalPages, readingMode, setPage, onNextEntry, isLastEntry]);

    const goToPrevPage = useCallback(() => {
        if (readingMode === 'paginated') {
            if (page > 0) {
                setPage(page - 1);
            } else if (onPrevEntry && !isFirstEntry) {
                onPrevEntry();
            }
        }
    }, [page, readingMode, setPage, onPrevEntry, isFirstEntry]);

    // Controles de teclado
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'ArrowLeft') {
                readingDirection === 'rtl' ? goToNextPage() : goToPrevPage();
            } else if (e.key === 'ArrowRight') {
                readingDirection === 'rtl' ? goToPrevPage() : goToNextPage();
            } else if (e.key === 'f' || e.key === 'F') {
                toggleFullscreen();
            } else if (e.key === 'Escape') {
                if (isFullscreen) {
                    exitFullscreen();
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [goToNextPage, goToPrevPage, readingDirection, isFullscreen]);

    // Fullscreen
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                setIsFullscreen(true);
            });
        } else {
            document.exitFullscreen().then(() => {
                setIsFullscreen(false);
            });
        }
    }, []);

    const exitFullscreen = useCallback(() => {
        if (document.fullscreenElement) {
            document.exitFullscreen().then(() => {
                setIsFullscreen(false);
            });
        }
    }, []);

    // Salvar progresso
    useEffect(() => {
        if (onSaveProgress && page !== lastSavedPage && totalPages > 0) {
            const timeoutId = setTimeout(() => {
                console.log(`💾 Salvando progresso: Página ${page + 1} do capítulo ${entryKey}`);
                try {
                    const result = onSaveProgress(
                        itemData?.slug || 'manga',
                        itemData?.sourceId || 'reader',
                        entryKey,
                        page
                    );
                    
                    if (result && typeof result.then === 'function') {
                        result.then(() => {
                            setLastSavedPage(page);
                        }).catch(console.error);
                    } else {
                        setLastSavedPage(page);
                    }
                } catch (error) {
                    console.error('Erro ao salvar progresso:', error);
                }
            }, 1000);

            return () => clearTimeout(timeoutId);
        }
    }, [page, lastSavedPage, onSaveProgress, itemData, entryKey, totalPages]);

    // Se não há páginas, mostra erro
    if (!pages || pages.length === 0) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center text-gray-400">
                    <BookOpenIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-4">Nenhuma página encontrada</p>
                    {onBack && (
                        <Button onClick={onBack} variant="primary">
                            Voltar
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`reader-container ${isFullscreen ? 'fullscreen' : ''}`}>
            {/* Controles superiores */}
            <div className={`reader-header ${showControls ? 'visible' : 'hidden'}`}>
                <div className="flex items-center justify-between p-4 bg-gray-900/90 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <Button
                                onClick={onBack}
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white"
                            >
                                <ChevronLeftIcon className="w-5 h-5 mr-2" />
                                Voltar
                            </Button>
                        )}
                        
                        <div className="text-white">
                            <h1 className="font-semibold">
                                {entry?.title || 'Lendo capítulo'}
                            </h1>
                            <p className="text-sm text-gray-400">
                                Página {page + 1} de {totalPages}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setReadingMode(readingMode === 'paginated' ? 'scroll' : 'paginated')}
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white"
                        >
                            {readingMode === 'paginated' ? 'Scroll' : 'Páginas'}
                        </Button>
                        
                        <Button
                            onClick={() => setReadingDirection(readingDirection === 'ltr' ? 'rtl' : 'ltr')}
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white"
                        >
                            {readingDirection === 'ltr' ? 'LTR' : 'RTL'}
                        </Button>
                        
                        <Button
                            onClick={toggleFullscreen}
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white"
                        >
                            {isFullscreen ? <ShrinkIcon className="w-5 h-5" /> : <ExpandIcon className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Conteúdo principal */}
            <div className="reader-content">
                {readingMode === 'paginated' ? (
                    // Modo paginado
                    <div className="paginated-reader">
                        {/* Área de navegação esquerda */}
                        <button
                            type="button"
                            onClick={readingDirection === 'rtl' ? goToNextPage : goToPrevPage}
                            className="reader-nav-area reader-nav-left"
                            aria-label="Página Anterior"
                        />

                        {/* Imagem principal */}
                        <div className="reader-page-container">
                            <Image
                                src={pages[page]}
                                alt={`Página ${page + 1}`}
                                className="reader-page-image"
                                loading="eager"
                                errorSrc="https://placehold.co/800x1200/1e293b/94a3b8?text=Erro+ao+Carregar"
                            />
                        </div>

                        {/* Área de navegação direita */}
                        <button
                            type="button"
                            onClick={readingDirection === 'rtl' ? goToPrevPage : goToNextPage}
                            className="reader-nav-area reader-nav-right"
                            aria-label="Próxima Página"
                        />
                    </div>
                ) : (
                    // Modo scroll
                    <div className="scrolling-reader">
                        <div className="max-w-4xl mx-auto space-y-1">
                            {pages.map((url, index) => (
                                <div key={index} className="scroll-page-container">
                                    <Image 
                                        src={url} 
                                        alt={`Página ${index + 1}`} 
                                        className="w-full"
                                        loading={index <= page + 2 ? "eager" : "lazy"}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Controles inferiores */}
            {readingMode === 'paginated' && (
                <div className={`reader-footer ${showControls ? 'visible' : 'hidden'}`}>
                    <div className="flex items-center justify-between p-4 bg-gray-900/90 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            <Button
                                onClick={goToPrevPage}
                                disabled={page === 0 && isFirstEntry}
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white disabled:opacity-50"
                            >
                                <ChevronLeftIcon className="w-5 h-5 mr-2" />
                                Anterior
                            </Button>
                        </div>

                        <div className="text-center text-gray-400">
                            <span className="text-sm">
                                {page + 1} / {totalPages}
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button
                                onClick={goToNextPage}
                                disabled={page === totalPages - 1 && isLastEntry}
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white disabled:opacity-50"
                            >
                                Próxima
                                <ChevronRightIcon className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ItemViewer;
