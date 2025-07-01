import { useState, useEffect, useRef, useCallback } from 'react';
import Spinner from '../common/Spinner';
import ErrorMessage from '../common/ErrorMessage';
import Image from '../common/Image';

const ItemViewer = ({ entry, page, setPage, onBack, readingMode, setReadingMode, onNextEntry, onPrevEntry, isFirstEntry, isLastEntry, itemData, entryKey, onSaveProgress }) => {
    const [showControls, setShowControls] = useState(true);
    const controlTimeout = useRef(null);
    const [lastSavedPage, setLastSavedPage] = useState(-1);

    // Função para mostrar controles e reiniciar timer
    const showControlsWithTimeout = useCallback(() => {
        setShowControls(true);
        clearTimeout(controlTimeout.current);
        controlTimeout.current = setTimeout(() => setShowControls(false), 3000);
    }, []);

    // Extração de páginas mais robusta
    const groupKeys = Object.keys(entry?.groups || {});
    const pages = groupKeys.length > 0 ? entry.groups[groupKeys[0]] : [];
    const totalPages = pages.length;

    // Otimização: Memoriza a função para evitar recriações
    const goToNextPage = useCallback(() => {
        showControlsWithTimeout();
        if (page < totalPages - 1) {
            setPage(p => p + 1);
        } else {
            onNextEntry();
        }
    }, [page, totalPages, onNextEntry, showControlsWithTimeout, setPage]);

    // Otimização: Memoriza a função para evitar recriações
    const goToPrevPage = useCallback(() => {
        showControlsWithTimeout();
        if (page > 0) {
            setPage(p => p - 1);
        } else {
            onPrevEntry();
        }
    }, [page, onPrevEntry, showControlsWithTimeout, setPage]);

    // Mouse event handler
    useEffect(() => {
        const handleMouseMove = () => {
            showControlsWithTimeout();
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(controlTimeout.current);
        };
    }, [showControlsWithTimeout]);

    // EFEITO DE SALVAMENTO OTIMIZADO
    useEffect(() => {
        if (onSaveProgress && page !== lastSavedPage) {
            const timeoutId = setTimeout(() => {
                console.warn(`Salvando progresso: Página ${page + 1} do capítulo ${entryKey}`);
                onSaveProgress(
                    itemData.slug,
                    itemData.sourceId,
                    entryKey,
                    page
                ).then(() => {
                    setLastSavedPage(page);
                }).catch(console.error);
            }, 1000);

            return () => clearTimeout(timeoutId);
        }
    }, [page, itemData, entryKey, lastSavedPage, onSaveProgress]);

    // Keyboard event handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (readingMode === 'paginated') {
                if (e.key === 'ArrowRight') goToNextPage(); 
                else if (e.key === 'ArrowLeft') goToPrevPage();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [readingMode, goToNextPage, goToPrevPage]);

    // Early returns após todos os hooks
    if (!entry || totalPages === 0) {
        return <ErrorMessage message="Capítulo sem páginas ou com dados inválidos." onRetry={onBack} />;
    }

    if (readingMode === 'paginated' && (page >= totalPages || page < 0)) {
        setPage(0);
        return <Spinner />;
    }

    return (
        <div className="relative">
            <div 
                className="fixed left-1/2 -translate-x-1/2 z-sticky transition-transform duration-300 panel-dark flex items-center gap-4 p-3"
                style={{ top: 'var(--space-4)', transform: `translateX(-50%) ${showControls ? 'translateY(0)' : 'translateY(-150%)'}` }}
            >
                <button className="btn btn-ghost" onClick={onBack}>&larr; Voltar</button>
                <h3 className="orbitron truncate">{entry.title}</h3>
                <span className="text-sm text-text-muted">{page + 1} / {totalPages}</span>
                <button className="btn btn-ghost" onClick={() => setReadingMode(p => p === 'paginated' ? 'scrolling' : 'paginated')}>
                    {readingMode === 'paginated' ? 'Scroll' : 'Páginas'}
                </button>
                <button className="btn btn-secondary" onClick={onPrevEntry} disabled={isFirstEntry}>Anterior</button>
                <button className="btn btn-secondary" onClick={onNextEntry} disabled={isLastEntry}>Próximo</button>
            </div>

            <div className="pt-24">
                {readingMode === 'paginated' ? (
                    <div className="flex items-center justify-center">
                        <button
                            type="button"
                            onClick={goToPrevPage}
                            className="absolute left-0 top-0 h-full w-1/3 cursor-pointer z-10"
                            // Botão invisível para navegação por clique na metade esquerda da tela
                            aria-label="Página Anterior"
                            tabIndex={0}
                            style={{ background: 'transparent', border: 'none' }}
                        />
                        <Image
                            src={pages[page]}
                            alt={`Página ${page + 1}`}
                            className="max-w-full max-h-[85vh] object-contain"
                            errorSrc="https://placehold.co/800x1200/1e293b/94a3b8?text=Erro"
                        />
                        <button
                            type="button"
                            onClick={goToNextPage}
                            className="absolute right-0 top-0 h-full w-1/3 cursor-pointer z-10"
                            // Botão invisível para navegação por clique na metade direita da tela
                            aria-label="Próxima Página"
                            tabIndex={0}
                            style={{ background: 'transparent', border: 'none' }}
                        />
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto flex flex-col gap-2">
                        {pages.map((url, index) => (
                            <Image key={index} src={url} alt={`Página ${index + 1}`} className="w-full rounded-md" />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ItemViewer;
