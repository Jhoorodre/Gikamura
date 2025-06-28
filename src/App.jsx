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
        // Anexe o widget ao container.
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

    if (hubLoading || itemLoading) return <Spinner />;
    if (hubError) return <ErrorMessage message={hubError} onRetry={resetApp} />;
    if (itemError) return <ErrorMessage message={itemError} onRetry={() => setSelectedItemData(null)} />;
    
    const entryKeys = currentHubData ? getEntryKeys() : [];
    const currentEntryIndex = currentHubData ? entryKeys.indexOf(selectedEntryKey) : -1;

    return (
        <div className="min-h-screen text-white relative">
            <div className="animated-bg"></div>
            <div id="particles-container"></div>

            {/* Container do Widget */}
            <div id="rs-widget-container" className="fixed top-4 right-4 z-50"></div>

            <div className={`container mx-auto px-4 relative z-10 ${!currentHubData ? 'min-h-screen flex items-center justify-center' : 'py-8'}`}>
                {!currentHubData ? (
                    <HubLoader 
                        onLoadHub={loadHub} 
                        loading={hubLoading} 
                    />
                ) : !selectedItemData ? (
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
                        <ItemGrid items={currentHubData.series} onSelectItem={selectItem} />
                    </>
                ) : !selectedEntryKey ? (
                    <>
                        <ItemInfo itemData={selectedItemData} onBackToHub={backToHub} />
                        <EntryList 
                            itemData={selectedItemData} 
                            onSelectEntry={selectEntry} 
                            sortOrder={sortOrder}
                            setSortOrder={setSortOrder}
                        />
                    </>
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
