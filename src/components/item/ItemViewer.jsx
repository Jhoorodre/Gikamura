import React, { useState, useEffect, useRef } from 'react';
import Spinner from '../common/Spinner';
import ErrorMessage from '../common/ErrorMessage';
import Image from '../common/Image';
import { remoteStorage, globalHistoryHandler } from '../../services/remoteStorage.js';

const ItemViewer = ({ entry, page, setPage, onBack, readingMode, setReadingMode, onNextEntry, onPrevEntry, isFirstEntry, isLastEntry, itemData }) => {
    const [showControls, setShowControls] = useState(true);
    const controlTimeout = useRef(null);

    // Função para mostrar controles e reiniciar timer
    const showControlsWithTimeout = () => {
        setShowControls(true);
        clearTimeout(controlTimeout.current);
        controlTimeout.current = setTimeout(() => setShowControls(false), 3000);
    };

    useEffect(() => {
        const handleMouseMove = () => {
            showControlsWithTimeout();
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(controlTimeout.current);
        };
    }, []);

    const pages = entry.groups[Object.keys(entry.groups)[0]] || [];
    const totalPages = pages.length;

    if (!entry || pages.length === 0) {
        return <ErrorMessage message="Entrada sem páginas ou com dados inválidos." onRetry={onBack} />;
    }
    if (readingMode === 'paginated' && (page >= totalPages || page < 0)) {
        setPage(0);
        return <Spinner />;
    }

    const goToNextPage = () => {
        showControlsWithTimeout(); // Garante que controles fiquem visíveis após clique
        if (page < totalPages - 1) setPage(p => p + 1); else onNextEntry();
    };
    const goToPrevPage = () => {
        showControlsWithTimeout(); // Garante que controles fiquem visíveis após clique
        if (page > 0) setPage(p => p - 1); else onPrevEntry();
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (readingMode === 'paginated') {
                if (e.key === 'ArrowRight') goToNextPage();
                else if (e.key === 'ArrowLeft') goToPrevPage();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [page, totalPages, readingMode, onNextEntry, onPrevEntry]);

    useEffect(() => {
        if (remoteStorage.connected && itemData && entry) {
            globalHistoryHandler.setLastReadPage(
                itemData.slug,
                itemData.source?.id,
                itemData.selectedEntryKey,
                page
            );
        }
    }, [page, itemData, entry]);

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
                        <div className="absolute left-0 top-0 h-full w-1/3 cursor-pointer" onClick={goToPrevPage}></div>
                        <Image
                            src={pages[page]}
                            alt={`Página ${page + 1}`}
                            className="max-w-full max-h-[85vh] object-contain"
                            errorSrc="https://placehold.co/800x1200/1e293b/94a3b8?text=Erro"
                        />
                        <div className="absolute right-0 top-0 h-full w-1/3 cursor-pointer" onClick={goToNextPage}></div>
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
