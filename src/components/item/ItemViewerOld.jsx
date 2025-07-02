import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Spinner from '../common/Spinner';
import ErrorMessage from '../common/ErrorMessage';
import Image from '../common/Image';
import { useReaderSettings, useImagePreloader, useReaderNavigation } from '../../hooks/useReaderSettings';

const ItemViewer = ({ 
    entry, 
    page, 
    setPage, 
    onBack, 
    readingMode: externalReadingMode, 
    setReadingMode: externalSetReadingMode, 
    onNextEntry, 
    onPrevEntry, 
    isFirstEntry, 
    isLastEntry, 
    itemData, 
    entryKey, 
    onSaveProgress 
}) => {
    const [lastSavedPage, setLastSavedPage] = useState(-1);
    
    // Usar configurações do leitor
    const {
        readingDirection,
        readingMode,
        showControls,
        isFullscreen,
        autoHideControls,
        toggleFullscreen,
        exitFullscreen,
        showControlsTemporarily,
        toggleReadingDirection,
        toggleReadingMode: internalToggleReadingMode
    } = useReaderSettings();

    // Usar modo de leitura externo se fornecido, senão usar interno
    const effectiveReadingMode = externalReadingMode || readingMode;
    const effectiveSetReadingMode = externalSetReadingMode || internalToggleReadingMode;

    // Extração de páginas mais robusta
    const groupKeys = Object.keys(entry?.groups || {});
    const pages = useMemo(() => {
        const extractedPages = groupKeys.length > 0 ? entry.groups[groupKeys[0]] : [];
        console.log('🖼️ [ItemViewer] Entry recebido:', entry);
        console.log('🖼️ [ItemViewer] Groups disponíveis:', groupKeys);
        console.log('🖼️ [ItemViewer] Páginas extraídas:', extractedPages.length, extractedPages.slice(0, 3));
        return extractedPages;
    }, [entry, groupKeys]);
    const totalPages = pages.length;

    // Hook de pré-carregamento
    const { preloadedImages, isPagePreloaded } = useImagePreloader(pages, page, 5);

    // Hook de navegação com suporte a RTL/LTR
    const { goToNextPage, goToPrevPage } = useReaderNavigation({
        page,
        setPage,
        totalPages,
        readingDirection,
        onNextEntry,
        onPrevEntry
    });

    // Mouse event handler
    useEffect(() => {
        const handleMouseMove = () => {
            showControlsTemporarily();
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [showControlsTemporarily]);

    // EFEITO DE SALVAMENTO OTIMIZADO
    useEffect(() => {
        if (onSaveProgress && page !== lastSavedPage) {
            const timeoutId = setTimeout(() => {
                console.warn(`Salvando progresso: Página ${page + 1} do capítulo ${entryKey}`);
                try {
                    const result = onSaveProgress(
                        itemData.slug,
                        itemData.sourceId,
                        entryKey,
                        page
                    );
                    
                    // Verifica se retornou uma Promise
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
    }, [page, itemData, entryKey, lastSavedPage, onSaveProgress]);

    // Keyboard event handler com suporte a direção de leitura
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (effectiveReadingMode === 'paginated') {
                const isRtl = readingDirection === 'rtl';
                
                if (e.key === 'ArrowRight') {
                    isRtl ? goToPrevPage() : goToNextPage();
                } else if (e.key === 'ArrowLeft') {
                    isRtl ? goToNextPage() : goToPrevPage();
                }
            }
            
            // Teclas globais
            if (e.key === 'f' || e.key === 'F') {
                toggleFullscreen();
            } else if (e.key === 'Escape') {
                if (isFullscreen) {
                    exitFullscreen();
                } else {
                    onBack();
                }
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [effectiveReadingMode, readingDirection, goToNextPage, goToPrevPage, isFullscreen, onBack, toggleFullscreen, exitFullscreen]);

    // Early returns após todos os hooks
    if (!entry || totalPages === 0) {
        return <ErrorMessage message="Capítulo sem páginas ou com dados inválidos." onRetry={onBack} />;
    }

    if (effectiveReadingMode === 'paginated' && (page >= totalPages || page < 0)) {
        setPage(0);
        return <Spinner />;
    }

    return (
        <div className={`reader-container ${isFullscreen ? 'fullscreen' : ''}`} style={{ backgroundColor: '#141414' }}>
            {/* Barra de controles superior */}
            <div 
                className="fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-in-out"
                style={{ 
                    top: showControls ? '1rem' : '-4rem',
                    transform: `translateX(-50%)`,
                    background: 'rgba(20, 20, 20, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    border: '1px solid rgba(52, 17, 17, 0.3)',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
            >
                <button 
                    className="btn-reader btn-reader-secondary" 
                    onClick={onBack}
                    title="Voltar (Esc)"
                >
                    ← Voltar
                </button>
                
                <div className="reader-title">
                    <h3 className="text-sm font-medium text-white truncate max-w-xs">
                        {entry.title}
                    </h3>
                    <span className="text-xs text-gray-400">
                        {page + 1} / {totalPages}
                    </span>
                </div>

                <div className="reader-controls">
                    <button 
                        className="btn-reader btn-reader-ghost" 
                        onClick={toggleReadingDirection}
                        title="Direção de Leitura"
                    >
                        {readingDirection === 'ltr' ? '→' : '←'}
                    </button>
                    
                    <button 
                        className="btn-reader btn-reader-ghost" 
                        onClick={() => effectiveSetReadingMode(effectiveReadingMode === 'paginated' ? 'scrolling' : 'paginated')}
                        title="Modo de Leitura"
                    >
                        {effectiveReadingMode === 'paginated' ? '📖' : '📜'}
                    </button>
                    
                    <button 
                        className="btn-reader btn-reader-ghost" 
                        onClick={toggleFullscreen}
                        title="Tela Cheia (F)"
                    >
                        {isFullscreen ? '🗗' : '🗖'}
                    </button>
                </div>

                <div className="chapter-navigation">
                    <button 
                        className="btn-reader btn-reader-primary" 
                        onClick={onPrevEntry} 
                        disabled={isFirstEntry}
                        title="Capítulo Anterior"
                    >
                        ⏮
                    </button>
                    <button 
                        className="btn-reader btn-reader-primary" 
                        onClick={onNextEntry} 
                        disabled={isLastEntry}
                        title="Próximo Capítulo"
                    >
                        ⏭
                    </button>
                </div>
            </div>

            {/* Área de leitura */}
            <div className="reader-content" style={{ paddingTop: isFullscreen ? '0' : '5rem' }}>
                {effectiveReadingMode === 'paginated' ? (
                    <div className="paginated-reader">
                        {/* Área de navegação esquerda */}
                        <button
                            type="button"
                            onClick={readingDirection === 'rtl' ? goToNextPage : goToPrevPage}
                            className="reader-nav-area reader-nav-left"
                            aria-label="Página Anterior"
                            tabIndex={0}
                        />

                        {/* Imagem principal */}
                        <div className="reader-page-container">
                            <Image
                                src={pages[page]}
                                alt={`Página ${page + 1}`}
                                className="reader-page-image"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: isFullscreen ? '100vh' : '90vh',
                                    objectFit: 'contain',
                                    display: 'block',
                                    margin: '0 auto'
                                }}
                                errorSrc="https://placehold.co/800x1200/1e293b/94a3b8?text=Erro+ao+Carregar"
                            />
                        </div>

                        {/* Área de navegação direita */}
                        <button
                            type="button"
                            onClick={readingDirection === 'rtl' ? goToPrevPage : goToNextPage}
                            className="reader-nav-area reader-nav-right"
                            aria-label="Próxima Página"
                            tabIndex={0}
                        />
                    </div>
                ) : (
                    <div className="scrolling-reader">
                        <div className="max-w-4xl mx-auto space-y-1">
                            {pages.map((url, index) => (
                                <div key={index} className="scroll-page-container">
                                    <Image 
                                        src={url} 
                                        alt={`Página ${index + 1}`} 
                                        className="w-full rounded-sm"
                                        style={{ display: 'block' }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Indicador de página no modo paginado */}
            {effectiveReadingMode === 'paginated' && (
                <div 
                    className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 transition-opacity duration-300"
                    style={{ 
                        opacity: showControls ? 1 : 0.3,
                        background: 'rgba(20, 20, 20, 0.8)',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        border: '1px solid rgba(52, 17, 17, 0.3)',
                        color: '#a4a4a4',
                        fontSize: '0.875rem'
                    }}
                >
                    {page + 1} / {totalPages}
                </div>
            )}
        </div>
    );
};

export default ItemViewer;
