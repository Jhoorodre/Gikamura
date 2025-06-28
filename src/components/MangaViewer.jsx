import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ViewColumnsIcon, DocumentIcon, ArrowUpIcon } from './Icones';
import Spinner from './Spinner';
import ErrorMessage from './ErrorMessage';

const MangaViewer = ({ chapter, page, setPage, onBack, readingMode, setReadingMode, onNextChapter, onPrevChapter, isFirstChapter, isLastChapter }) => {
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [activeGroup, setActiveGroup] = useState(Object.keys(chapter.groups || {})[0] || null);
    
    useEffect(() => { setActiveGroup(Object.keys(chapter.groups || {})[0] || null); }, [chapter]);

    const checkScrollTop = () => { if (!showScrollTop && window.pageYOffset > 400) setShowScrollTop(true); else if (showScrollTop && window.pageYOffset <= 400) setShowScrollTop(false); };
    const scrollTop = () => { window.scrollTo({top: 0, behavior: 'smooth'}); };

    useEffect(() => { 
        if (readingMode === 'scrolling') { 
            window.addEventListener('scroll', checkScrollTop); 
            return () => window.removeEventListener('scroll', checkScrollTop); 
        } else { 
            setShowScrollTop(false); 
        } 
    }, [readingMode, showScrollTop]);

    const pages = activeGroup ? chapter.groups[activeGroup] : [];
    const totalPages = pages.length;

    if (!chapter || !activeGroup || pages.length === 0) { return <ErrorMessage message="Capítulo sem páginas ou com dados inválidos." onRetry={onBack} />; }
    if (readingMode === 'paginated' && (page >= totalPages || page < 0)) { setPage(0); return <Spinner />; }

    const goToNextPage = () => { if (page < totalPages - 1) setPage(p => p + 1); };
    const goToPrevPage = () => { if (page > 0) setPage(p => p - 1); };
    
    useEffect(() => { 
        const handleKeyDown = (e) => { 
            if (readingMode === 'paginated') { 
                if (e.key === 'ArrowRight') goToNextPage(); 
                else if (e.key === 'ArrowLeft') goToPrevPage(); 
            } 
        }; 
        window.addEventListener('keydown', handleKeyDown); 
        return () => window.removeEventListener('keydown', handleKeyDown); 
    }, [page, totalPages, readingMode]);

    return (
        <div className="w-full mx-auto mt-8">
            <div className="panel-solid rounded-2xl p-6 mb-8 fade-in">
                <div className="flex justify-between items-center w-full flex-wrap gap-4">
                    <button onClick={onBack} className="panel-dark px-6 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-300 flex items-center gap-2"><ChevronLeftIcon /><span className="hidden sm:inline">Voltar</span></button>
                    <div className="text-center flex-grow text-white">
                        <h3 className="text-xl md:text-2xl font-bold orbitron mb-1">{chapter.title}</h3>
                        {readingMode === 'paginated' && (<p className="text-red-300">Página {page + 1} de {totalPages}</p>)}
                    </div>
                    <button onClick={() => setReadingMode(readingMode === 'paginated' ? 'scrolling' : 'paginated')} className="panel-dark px-6 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-300 flex items-center gap-2">
                        {readingMode === 'paginated' ? <ViewColumnsIcon /> : <DocumentIcon />}<span className="hidden sm:inline">{readingMode === 'paginated' ? 'Scroll' : 'Página'}</span>
                    </button>
                </div>
                {Object.keys(chapter.groups || {}).length > 1 && (<div className="mt-4 flex flex-wrap gap-2">{Object.keys(chapter.groups).map((groupKey) => (<button key={groupKey} onClick={() => setActiveGroup(groupKey)} className={`px-4 py-2 rounded-lg transition-all duration-300 ${activeGroup === groupKey ? 'bg-gradient-to-r from-red-800 to-red-600 text-white' : 'panel-dark text-gray-300 hover:bg-white/10'}`}>{groupKey}</button>))}</div>)}
                <div className="mt-4 flex justify-between items-center"><button onClick={onPrevChapter} disabled={isFirstChapter} className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 ${isFirstChapter ? 'panel-dark text-gray-500 cursor-not-allowed' : 'panel-dark text-white hover:bg-white/10'}`}><ChevronLeftIcon /><span className="hidden sm:inline">Cap. Anterior</span></button><button onClick={onNextChapter} disabled={isLastChapter} className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 ${isLastChapter ? 'panel-dark text-gray-500 cursor-not-allowed' : 'panel-dark text-white hover:bg-white/10'}`}><span className="hidden sm:inline">Próximo Cap.</span><ChevronRightIcon /></button></div>
            </div>

            {readingMode === 'paginated' ? (
                <div className="p-4 sm:p-8 fade-in">
                    <div className="flex justify-center mb-6"><img src={`https://corsproxy.io/?${encodeURIComponent(pages[page])}`} alt={`Página ${page + 1}`} className="max-w-full h-auto rounded-xl shadow-2xl" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/800x1200/1f2937/4b5563?text=Erro+ao+Carregar'; }}/></div>
                    <div className="flex justify-between items-center"><button onClick={goToPrevPage} disabled={page === 0} className={`px-4 py-3 md:px-8 md:py-4 rounded-xl transition-all duration-300 flex items-center gap-3 ${page === 0 ? 'panel-dark text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-red-800 to-red-600 text-white hover:from-red-700 hover:to-red-500'}`}><ChevronLeftIcon /><span>Anterior</span></button><span className="text-white font-medium text-lg">{page + 1} / {totalPages}</span><button onClick={goToNextPage} disabled={page === totalPages - 1} className={`px-4 py-3 md:px-8 md:py-4 rounded-xl transition-all duration-300 flex items-center gap-3 ${page === totalPages - 1 ? 'panel-dark text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-red-800 to-red-600 text-white hover:from-red-700 hover:to-red-500'}`}><span>Próxima</span><ChevronRightIcon /></button></div>
                </div>
            ) : (
                <div className="p-4 sm:p-8 fade-in">
                    <div className="space-y-4">{pages.map((pageUrl, index) => (<div key={index} className="flex justify-center"><img src={`https://corsproxy.io/?${encodeURIComponent(pageUrl)}`} alt={`Página ${index + 1}`} className="max-w-full h-auto rounded-xl shadow-lg" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/800x1200/1f2937/4b5563?text=Erro+ao+Carregar'; }}/></div>))}</div>
                </div>
            )}
            {showScrollTop && (<button onClick={scrollTop} className="fixed bottom-8 right-8 bg-gradient-to-r from-red-800 to-red-600 text-white p-4 rounded-full shadow-2xl hover:from-red-700 hover:to-red-500 transition-all duration-300 z-30"><ArrowUpIcon /></button>)}
        </div>
    );
};

export default MangaViewer;
