import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ViewColumnsIcon, DocumentIcon, ArrowUpIcon } from '../common/Icones';
import Spinner from '../common/Spinner';
import ErrorMessage from '../common/ErrorMessage';
import Image from '../common/Image';

const MangaViewer = ({ chapter, page, setPage, onBack, readingMode, setReadingMode, onNextChapter, onPrevChapter, isFirstChapter, isLastChapter }) => {
    const [showControls, setShowControls] = useState(true);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [activeGroup, setActiveGroup] = useState(Object.keys(chapter.groups || {})[0] || null);
    const controlTimeout = useRef(null);

    useEffect(() => {
        setActiveGroup(Object.keys(chapter.groups || {})[0] || null);
    }, [chapter]);

    // Lógica para auto-ocultar controles
    const handleMouseMove = () => {
        setShowControls(true);
        clearTimeout(controlTimeout.current);
        controlTimeout.current = setTimeout(() => setShowControls(false), 3000);
    };

    const checkScrollTop = () => {
        if (window.pageYOffset > 400) setShowScrollTop(true);
        else setShowScrollTop(false);
    };

    const scrollTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        if (readingMode === 'scrolling') {
            window.addEventListener('scroll', checkScrollTop);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('scroll', checkScrollTop);
            clearTimeout(controlTimeout.current);
        };
    }, [readingMode]);

    const pages = activeGroup ? chapter.groups[activeGroup] : [];
    const totalPages = pages.length;

    if (!chapter || !activeGroup || pages.length === 0) {
        return <ErrorMessage message="Capítulo sem páginas ou com dados inválidos." onRetry={onBack} />;
    }
    if (readingMode === 'paginated' && (page >= totalPages || page < 0)) {
        setPage(0);
        return <Spinner />;
    }

    const goToNextPage = () => { if (page < totalPages - 1) setPage(p => p + 1); else onNextChapter(); };
    const goToPrevPage = () => { if (page > 0) setPage(p => p - 1); else onPrevChapter(); };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (readingMode === 'paginated') {
                if (e.key === 'ArrowRight') goToNextPage();
                else if (e.key === 'ArrowLeft') goToPrevPage();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [page, totalPages, readingMode, onNextChapter, onPrevChapter]);

    return (
        <div className="w-full mx-auto relative">
            {/* Controles Superiores Flutuantes */}
            <div className={`fixed top-0 left-0 right-0 z-20 transition-transform duration-300 ${showControls ? 'translate-y-0' : '-translate-y-full'}`}>
                <div className="bg-gray-900/80 backdrop-blur-sm p-4 m-4 rounded-xl shadow-lg">
                    <div className="flex justify-between items-center w-full flex-wrap gap-4">
                        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors"><ChevronLeftIcon /> Voltar</button>
                        <div className="text-center flex-grow text-white">
                            <h3 className="text-lg md:text-xl font-bold truncate">{chapter.title}</h3>
                            {readingMode === 'paginated' && <p className="text-sm text-gray-400">Página {page + 1} de {totalPages}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setReadingMode(readingMode === 'paginated' ? 'scrolling' : 'paginated')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors">
                                {readingMode === 'paginated' ? <ViewColumnsIcon /> : <DocumentIcon />}
                            </button>
                             <button onClick={onNextChapter} disabled={isLastChapter} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                Próximo <ChevronRightIcon />
                             </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Conteúdo do Leitor */}
            <div className="pt-24">
                {readingMode === 'paginated' ? (
                    <div className="flex items-center justify-center fade-in">
                        <div className="absolute left-0 top-0 h-full w-1/3 cursor-pointer" onClick={goToPrevPage}></div>
                        <Image
                            src={pages[page]}
                            alt={`Página ${page + 1}`}
                            className="max-w-full max-h-[85vh] h-auto object-contain rounded-lg shadow-2xl"
                            errorSrc='https://placehold.co/800x1200/1f2937/4b5563?text=Erro+ao+Carregar'
                        />
                        <div className="absolute right-0 top-0 h-full w-1/3 cursor-pointer" onClick={goToNextPage}></div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-2 fade-in">
                        {pages.map((pageUrl, index) => (
                            <Image
                                key={index}
                                src={pageUrl}
                                alt={`Página ${index + 1}`}
                                className="w-full h-auto rounded"
                                errorSrc='https://placehold.co/800x1200/1f2937/4b5563?text=Erro+ao+Carregar'
                            />
                        ))}
                    </div>
                )}
            </div>
            
            {/* Botão de Voltar ao Topo */}
            {showScrollTop && readingMode === 'scrolling' && (
                <button onClick={scrollTop} className="fixed bottom-8 right-8 bg-red-700 text-white p-4 rounded-full shadow-lg hover:bg-red-600 transition-colors z-30">
                    <ArrowUpIcon />
                </button>
            )}
        </div>
    );
};

export default MangaViewer;
