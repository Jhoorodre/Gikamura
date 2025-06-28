import React, { useState, useEffect, useMemo } from 'react';
import { useHistory } from './context/HistoryContext';
import HubLoader from './components/HubLoader';
import HubHeader from './components/HubHeader';
import MangaGrid from './components/MangaGrid';
import MangaInfo from './components/MangaInfo';
import ChapterList from './components/ChapterList';
import MangaViewer from './components/MangaViewer';
import Spinner from './components/Spinner';
import ErrorMessage from './components/ErrorMessage';
import Widget from 'remotestorage-widget';
import './App.css';

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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sortOrder, setSortOrder] = useState('desc');
    const history = useHistory();

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
            setLoading(true);
            setError(null);
            setCurrentHubUrl(url);
            const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
            if (!response.ok) throw new Error(`Não foi possível carregar o hub (status: ${response.status})`);
            const data = await response.json();
            setHubData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const selectManga = async (mangaObject) => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(mangaObject.data.url)}`);
            if (!response.ok) throw new Error(`Não foi possível carregar os capítulos do mangá (status: ${response.status})`);
            const chaptersData = await response.json();
            
            const completeMangaData = {
                ...mangaObject,
                chapters: chaptersData.chapters
            };
            
            setSelectedMangaData(completeMangaData);
            setSelectedChapterKey(null);
            setCurrentPage(0);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
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
         setError(null);
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

    if (loading) return <Spinner />;
    if (error) return <ErrorMessage message={error} onRetry={resetApp} />;
    
    const chapterKeys = currentHubData ? getChapterKeys() : [];
    const currentChapterIndex = currentHubData ? chapterKeys.indexOf(selectedChapterKey) : -1;

    return (
        <div className="min-h-screen text-white relative">
            <div className="animated-bg"></div>
            <div id="particles-container"></div>
            <div id="rs-widget-container"></div>
            
            {/* Este div agora controla o layout principal */}
            <div className={`container mx-auto px-4 relative z-10 ${!currentHubData ? 'min-h-screen flex items-center justify-center' : 'py-8'}`}>
                {!currentHubData ? (
                    <HubLoader 
                        onLoadHub={loadHub} 
                        loading={loading} 
                        savedHubs={savedHubs}
                        onSelectSavedHub={handleSelectSavedHub}
                        onRemoveSavedHub={handleRemoveSavedHub}
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
