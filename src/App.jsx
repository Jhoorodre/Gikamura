import React, { useState, useEffect, useMemo } from 'react';
import { useHistory } from './context/HistoryContext'; // CAMINHO CORRIGIDO
import { useManga } from './hooks/useManga'; // CAMINHO CORRIGIDO
import HubLoader from './components/hub/HubLoader';
import HubHeader from './components/hub/HubHeader';
import MangaGrid from './components/manga/MangaGrid';
import MangaInfo from './components/manga/MangaInfo';
import ChapterList from './components/manga/ChapterList';
import MangaViewer from './components/manga/MangaViewer';
import Spinner from './components/common/Spinner';
import ErrorMessage from './components/common/ErrorMessage';
import Widget from 'remotestorage-widget';
import './styles/App.css'; // MANTIDO
import { CORS_PROXY_URL } from './constants';

const createParticles = () => {
    const container = document.getElementById('particles-container');
    if (!container || container.childElementCount > 0) return;
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.width = Math.random() * 4 + 2 + 'px';
        particle.style.height = particle.style.width;
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
        container.appendChild(particle);
    }
};

function App() {
    const [currentHubData, setHubData] = useState(null);
    const [currentHubUrl, setCurrentHubUrl] = useState('');
    const [savedHubs, setSavedHubs] = useState([]);
    const [selectedMangaData, setSelectedMangaData] = useState(null);
    const [selectedChapterKey, setSelectedChapterKey] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [readingMode, setReadingMode] = useState('paginated');
    const [sortOrder, setSortOrder] = useState('desc');
    const history = useHistory();
    const { loading: mangaLoading, error: mangaError, fetchMangaData } = useManga();
    const [hubLoading, setHubLoading] = useState(false);
    const [hubError, setHubError] = useState(null);

    const loadSavedHubs = async () => {
        const hubs = await history.getAllHubs();
        setSavedHubs(hubs);
    };

    useEffect(() => {
        createParticles();
        loadSavedHubs();
        const widget = new Widget(history.remoteStorage, {});
        widget.attach("rs-widget-container");
    }, []);

    const isHubSaved = useMemo(() => {
        return savedHubs.some(hub => hub.url === currentHubUrl);
    }, [savedHubs, currentHubUrl]);

    const handleSaveHub = async () => {
        if (!currentHubData || !currentHubUrl) return;

        if (isHubSaved) {
            await history.removeHub(currentHubUrl);
        } else {
            await history.addHub(currentHubUrl, currentHubData.hub.title, currentHubData.hub.icon.url);
        }
        loadSavedHubs();
    };
    
    const handleRemoveSavedHub = async (url) => {
         if (confirm(`Tem a certeza que quer remover o hub "${savedHubs.find(h => h.url === url).title}"?`)) {
            await history.removeHub(url);
            loadSavedHubs();
         }
    }
    
    const handleSelectSavedHub = (hub) => {
        loadHub(hub.url);
    }

    const loadHub = async (url) => {
        try {
            setHubLoading(true);
            setHubError(null);
            setCurrentHubUrl(url);
            const response = await fetch(`${CORS_PROXY_URL}${encodeURIComponent(url)}`);
            if (!response.ok) throw new Error(`Não foi possível carregar o hub (status: ${response.status})`);
            const data = await response.json();
            setHubData(data);
        } catch (err) {
            setHubError(err.message);
        } finally {
            setHubLoading(false);
        }
    };

    const selectManga = async (mangaObject) => {
        const completeMangaData = await fetchMangaData(mangaObject);
        if (completeMangaData) {
            setSelectedMangaData(completeMangaData);
            setSelectedChapterKey(null);
            setCurrentPage(0);
        }
    };

    const selectChapter = (chapterKey) => {
        setSelectedChapterKey(chapterKey);
        setCurrentPage(0);
        window.scrollTo({top: 0, behavior: 'smooth'}); 
    };

    const backToHub = () => {
        setSelectedMangaData(null);
        setSelectedChapterKey(null);
        setCurrentPage(0);
    };
    
    const backToManga = () => {
        setSelectedChapterKey(null);
        setCurrentPage(0);
    };
    
    const resetApp = () => {
         setHubData(null);
         setSelectedMangaData(null);
         setSelectedChapterKey(null);
         setHubError(null);
         setCurrentHubUrl('');
    }

    const getChapterKeys = () => {
        if (!selectedMangaData?.chapters) return [];
        const keys = Object.keys(selectedMangaData.chapters);
        return keys.sort((a, b) => {
            const numA = parseFloat(a.match(/(\d+(\.\d+)?)/)?.[0]) || 0;
            const numB = parseFloat(b.match(/(\d+(\.\d+)?)/)?.[0]) || 0;
            
            if(numA !== numB) {
                return sortOrder === 'asc' ? numA - numB : numB - numA;
            }
            return sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
        });
    };

    const navigateChapter = (direction) => {
        const chapterKeys = getChapterKeys();
        const currentIndex = chapterKeys.indexOf(selectedChapterKey);
        const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        
        if (nextIndex >= 0 && nextIndex < chapterKeys.length) {
            selectChapter(chapterKeys[nextIndex]);
        }
    };

    if (hubLoading || mangaLoading) return <Spinner />;
    if (hubError) return <ErrorMessage message={hubError} onRetry={resetApp} />;
    if (mangaError) return <ErrorMessage message={mangaError} onRetry={() => setSelectedMangaData(null)} />;
    
    const chapterKeys = currentHubData ? getChapterKeys() : [];
    const currentChapterIndex = currentHubData ? chapterKeys.indexOf(selectedChapterKey) : -1;

    return (
        <div className="min-h-screen text-white relative">
            <div className="animated-bg"></div>
            <div id="particles-container"></div>
            <div id="rs-widget-container"></div>
            
            <div className={`container mx-auto px-4 relative z-10 ${!currentHubData ? 'min-h-screen flex items-center justify-center' : 'py-8'}`}>
                {!currentHubData ? (
                    <HubLoader 
                        onLoadHub={loadHub} 
                        loading={hubLoading} 
                    />
                ) : !selectedMangaData ? (
                    <>
                        <div className="text-center mb-16 fade-in">
                             <button onClick={resetApp} className="panel-dark px-4 py-2 rounded-lg text-sm text-red-300 hover:bg-white/10 transition-all">Carregar outro Hub</button>
                        </div>
                        <HubHeader 
                            hub={currentHubData.hub} 
                            social={currentHubData.social}
                            onSaveHub={handleSaveHub}
                            isHubSaved={isHubSaved}
                        />
                        <MangaGrid series={currentHubData.series} onSelectManga={selectManga} />
                    </>
                ) : !selectedChapterKey ? (
                    <>
                        <MangaInfo mangaData={selectedMangaData} onBackToHub={backToHub} />
                        <ChapterList 
                            mangaData={selectedMangaData} 
                            onSelectChapter={selectChapter} 
                            sortOrder={sortOrder}
                            setSortOrder={setSortOrder}
                        />
                    </>
                ) : (
                    <MangaViewer 
                        chapter={selectedMangaData.chapters[selectedChapterKey]} 
                        page={currentPage} 
                        setPage={setCurrentPage} 
                        onBack={backToManga}
                        readingMode={readingMode} 
                        setReadingMode={setReadingMode}
                        onNextChapter={() => navigateChapter('next')}
                        onPrevChapter={() => navigateChapter('prev')}
                        isFirstChapter={currentChapterIndex === 0}
                        isLastChapter={chapterKeys.length > 0 && currentChapterIndex === chapterKeys.length - 1}
                    />
                )}
            </div>
        </div>
    );
}

export default App;
