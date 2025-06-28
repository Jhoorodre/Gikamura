import React, { useState, useEffect, useMemo } from 'react';
import { useHistory } from './context/HistoryContext';
import { useItem } from './hooks/useItem';
import HubLoader from './components/hub/HubLoader';
import HubHeader from './components/hub/HubHeader';
import ItemGrid from './components/item/ItemGrid';
import ItemInfo from './components/item/ItemInfo';
import EntryList from './components/item/EntryList';
import ItemViewer from './components/item/ItemViewer';
import Spinner from './components/common/Spinner';
import ErrorMessage from './components/common/ErrorMessage';
import Widget from 'remotestorage-widget';
import './styles/App.css';
import { CORS_PROXY_URL } from './constants';

const createParticles = () => {
    const container = document.getElementById('particles-container');
    if (!container || container.childElementCount > 0) return;
    
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.width = Math.random() * 3 + 1 + 'px';
        particle.style.height = particle.style.width;
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (Math.random() * 15 + 20) + 's';
        container.appendChild(particle);
    }
};

function App() {
    const [currentHubData, setHubData] = useState(null);
    const [currentHubUrl, setCurrentHubUrl] = useState('');
    const [savedHubs, setSavedHubs] = useState([]);
    const [selectedItemData, setSelectedItemData] = useState(null);
    const [selectedEntryKey, setSelectedEntryKey] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [readingMode, setReadingMode] = useState('paginated');
    const [sortOrder, setSortOrder] = useState('desc');

    const history = useHistory();
    const { loading: itemLoading, error: itemError, fetchItemData } = useItem();
    const [hubLoading, setHubLoading] = useState(false);
    const [hubError, setHubError] = useState(null);

    const loadSavedHubs = async () => {
        const hubs = await history.getAllHubs();
        setSavedHubs(hubs);
    };

    useEffect(() => {
        createParticles();
        loadSavedHubs();
        const widget = new Widget(history.remoteStorage);
        widget.attach("rs-widget-container"); 
    }, [history.remoteStorage]);

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

    const selectItem = async (itemObject) => {
        const completeItemData = await fetchItemData(itemObject);
        if (completeItemData) {
            setSelectedItemData(completeItemData);
            setSelectedEntryKey(null);
            setCurrentPage(0);
        }
    };

    const selectEntry = (entryKey) => {
        setSelectedEntryKey(entryKey);
        setCurrentPage(0);
        window.scrollTo({top: 0, behavior: 'smooth'}); 
    };

    const backToHub = () => {
        setSelectedItemData(null);
        setSelectedEntryKey(null);
        setCurrentPage(0);
    };
    
    const backToItem = () => {
        setSelectedEntryKey(null);
        setCurrentPage(0);
    };
    
    const resetApp = () => {
         setHubData(null);
         setSelectedItemData(null);
         setSelectedEntryKey(null);
         setHubError(null);
         setCurrentHubUrl('');
    }

    const getEntryKeys = () => {
        if (!selectedItemData?.entries) return [];
        const keys = Object.keys(selectedItemData.entries);
        return keys.sort((a, b) => {
            const numA = parseFloat(a.match(/(\d+(\.\d+)?)/)?.[0]) || 0;
            const numB = parseFloat(b.match(/(\d+(\.\d+)?)/)?.[0]) || 0;
            
            if(numA !== numB) {
                return sortOrder === 'asc' ? numA - numB : numB - numA;
            }
            return sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
        });
    };

    const navigateEntry = (direction) => {
        const entryKeys = getEntryKeys();
        const currentIndex = entryKeys.indexOf(selectedEntryKey);
        const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        
        if (nextIndex >= 0 && nextIndex < entryKeys.length) {
            selectEntry(entryKeys[nextIndex]);
        }
    };

    if (hubLoading || itemLoading) return (
        <div className="min-h-screen flex items-center justify-center relative">
            <div className="animated-bg"></div>
            <div id="particles-container"></div>
            <Spinner />
        </div>
    );

    if (hubError) return (
        <div className="min-h-screen flex items-center justify-center relative">
            <div className="animated-bg"></div>
            <div id="particles-container"></div>
            <ErrorMessage message={hubError} onRetry={resetApp} />
        </div>
    );

    if (itemError) return (
        <div className="min-h-screen flex items-center justify-center relative">
            <div className="animated-bg"></div>
            <div id="particles-container"></div>
            <ErrorMessage message={itemError} onRetry={() => setSelectedItemData(null)} />
        </div>
    );
    
    const entryKeys = currentHubData ? getEntryKeys() : [];
    const currentEntryIndex = currentHubData ? entryKeys.indexOf(selectedEntryKey) : -1;

    return (
        <div className="min-h-screen text-white relative">
            <div className="animated-bg"></div>
            <div id="particles-container"></div>

            {/* Container do Widget RemoteStorage */}
            <div id="rs-widget-container" className="fixed top-6 right-6 z-50"></div>

            <div className="relative z-10">
                {!currentHubData ? (
                    <div className="min-h-screen flex items-center justify-center p-6">
                        <div className="w-full max-w-md">
                            <HubLoader 
                                onLoadHub={loadHub} 
                                loading={hubLoading} 
                            />
                        </div>
                    </div>
                ) : !selectedItemData ? (
                    <div className="min-h-screen">
                        {/* Header com navegação */}
                        <header className="sticky top-0 z-40 glass-panel m-6 mb-0">
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center space-x-4">
                                    <button 
                                        onClick={resetApp} 
                                        className="btn-ghost text-red-400 hover:text-red-300"
                                    >
                                        ← Carregar outro Hub
                                    </button>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                    <div className="badge badge-primary">
                                        {currentHubData.series?.length || 0} itens
                                    </div>
                                </div>
                            </div>
                        </header>

                        {/* Conteúdo principal */}
                        <main className="container mx-auto px-6 pb-12">
                            <div className="fade-in">
                                <HubHeader 
                                    hub={currentHubData.hub} 
                                    social={currentHubData.social}
                                    onSaveHub={handleSaveHub}
                                    isHubSaved={isHubSaved}
                                />
                            </div>
                            
                            <div className="slide-in">
                                <ItemGrid items={currentHubData.series} onSelectItem={selectItem} />
                            </div>
                        </main>
                    </div>
                ) : !selectedEntryKey ? (
                    <div className="min-h-screen">
                        {/* Header de item */}
                        <header className="sticky top-0 z-40 glass-panel m-6 mb-0">
                            <div className="flex items-center justify-between p-4">
                                <button 
                                    onClick={backToHub} 
                                    className="btn-ghost"
                                >
                                    ← Voltar ao Hub
                                </button>
                                
                                <div className="flex items-center space-x-2">
                                    <div className="badge badge-primary">
                                        {Object.keys(selectedItemData.entries || {}).length} entradas
                                    </div>
                                </div>
                            </div>
                        </header>

                        {/* Conteúdo do item */}
                        <main className="container mx-auto px-6 pb-12">
                            <div className="fade-in">
                                <ItemInfo itemData={selectedItemData} onBackToHub={backToHub} />
                            </div>
                            
                            <div className="slide-in">
                                <EntryList 
                                    itemData={selectedItemData} 
                                    onSelectEntry={selectEntry} 
                                    sortOrder={sortOrder}
                                    setSortOrder={setSortOrder}
                                />
                            </div>
                        </main>
                    </div>
                ) : (
                    <ItemViewer 
                        entry={selectedItemData.entries[selectedEntryKey]} 
                        page={currentPage} 
                        setPage={setCurrentPage} 
                        onBack={backToItem}
                        readingMode={readingMode} 
                        setReadingMode={setReadingMode}
                        onNextEntry={() => navigateEntry('next')}
                        onPrevEntry={() => navigateEntry('prev')}
                        isFirstEntry={currentEntryIndex === 0}
                        isLastEntry={entryKeys.length > 0 && currentEntryIndex === entryKeys.length - 1}
                    />
                )}
            </div>
        </div>
    );
}

export default App;