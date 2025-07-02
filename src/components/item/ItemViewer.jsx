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
                    // Passa apenas a página atual - o ChapterReaderView cuidará dos outros parâmetros
                    const result = onSaveProgress(page);
                    
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
        <div className={`${isFullscreen ? 'fixed inset-0 z-50' : ''} bg-black min-h-screen`}>
            {/* Header minimalista */}
            <div className={`fixed top-0 left-0 right-0 z-30 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="flex items-center justify-between p-3 bg-black/80">
                    {onBack && (
                        <Button
                            onClick={onBack}
                            variant="ghost"
                            className="text-gray-400 hover:text-white px-2 py-1 text-sm"
                        >
                            <ChevronLeftIcon className="w-4 h-4 mr-1" />
                            Voltar
                        </Button>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-white">
                        <span>{page + 1} / {totalPages}</span>
                        <Button
                            onClick={() => setReadingMode(readingMode === 'paginated' ? 'scroll' : 'paginated')}
                            variant="ghost"
                            className="text-gray-400 hover:text-white px-2 py-1 text-xs"
                        >
                            {readingMode === 'paginated' ? 'Scroll' : 'Páginas'}
                        </Button>
                    </div>
                    
                    <Button
                        onClick={toggleFullscreen}
                        variant="ghost"
                        className="text-gray-400 hover:text-white px-2 py-1"
                    >
                        {isFullscreen ? <ShrinkIcon className="w-4 h-4" /> : <ExpandIcon className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {/* Conteúdo principal */}
            <div className="reader-content">
                {readingMode === 'paginated' ? (
                    // Modo paginado
                    <div className="relative flex items-center justify-center min-h-screen">
                        {/* Área de navegação esquerda */}
                        <button
                            type="button"
                            onClick={readingDirection === 'rtl' ? goToNextPage : goToPrevPage}
                            className="absolute left-0 top-0 w-1/3 h-full bg-transparent hover:opacity-80 z-20 cursor-w-resize"
                            aria-label="Página Anterior"
                            disabled={page === 0 && isFirstEntry}
                        />

                        {/* Imagem principal */}
                        <div className="flex items-center justify-center p-4 max-w-full max-h-screen">
                            <Image
                                src={pages[page]}
                                alt={`Página ${page + 1}`}
                                className="max-w-full max-h-[calc(100vh-2rem)] object-contain"
                                loading="eager"
                                errorSrc="https://placehold.co/800x1200/1e293b/94a3b8?text=Erro+ao+Carregar"
                            />
                        </div>

                        {/* Área de navegação direita */}
                        <button
                            type="button"
                            onClick={readingDirection === 'rtl' ? goToPrevPage : goToNextPage}
                            className="absolute right-0 top-0 w-1/3 h-full bg-transparent hover:opacity-80 z-20 cursor-e-resize"
                            aria-label="Próxima Página"
                            disabled={page === totalPages - 1 && isLastEntry}
                        />
                    </div>
                ) : (
                    // Modo scroll
                    <div className="pt-16 pb-4">
                        <div className="max-w-4xl mx-auto px-4">
                            {pages.map((url, index) => (
                                <div key={index} className="mb-2">
                                    <Image 
                                        src={url} 
                                        alt={`Página ${index + 1}`} 
                                        className="w-full max-w-full"
                                        loading={Math.abs(index - page) <= 3 ? "eager" : "lazy"}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ItemViewer;
