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
import { CORS_PROXY_URL } from './constants';

const createParticles = () => {
    const container = document.getElementById('particles-container');
    if (!container || container.childElementCount > 0) return;
    
    for (let i = 0; i < 20; i++) { // Reduzido o número de partículas
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.width = `${Math.random() * 3 + 1}px`;
        particle.style.height = particle.style.width;
        particle.style.animationDelay = `${Math.random() * 25}s`;
        particle.style.animationDuration = `${Math.random() * 15 + 10}s`;
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

    useEffect(() => {
        createParticles();
        const widget = new Widget(history.remoteStorage);
        widget.attach("rs-widget-container");
    }, [history.remoteStorage]);

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

    if (hubLoading || itemLoading) return <div className="flex-grow flex items-center justify-center"><Spinner /></div>;
    if (hubError) return <div className="flex-grow flex items-center justify-center"><ErrorMessage message={hubError} onRetry={resetApp} /></div>;
    if (itemError) return <div className="flex-grow flex items-center justify-center"><ErrorMessage message={itemError} onRetry={() => setSelectedItemData(null)} /></div>;
    
    const entryKeys = currentHubData ? getEntryKeys() : [];
    const currentEntryIndex = currentHubData ? entryKeys.indexOf(selectedEntryKey) : -1;

    return (
        <>
            <div className="animated-bg"></div>
            <div id="particles-container"></div>
            <div id="rs-widget-container" style={{ position: 'fixed', top: 'var(--space-4)', right: 'var(--space-4)', zIndex: 'var(--z-fixed)' }}></div>
            
            <main className="container mx-auto px-4 py-8 flex-grow">
                {!currentHubData ? (
                    <div className="min-h-full flex items-center justify-center">
                        <HubLoader 
                            onLoadHub={loadHub} 
                            loading={hubLoading} 
                        />
                    </div>
                ) : !selectedItemData ? (
                    <>
                        <HubHeader 
                            hub={currentHubData.hub} 
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
            </main>
        </>
    );
}

export default App;