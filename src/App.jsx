import React, { useState, useEffect, useRef } from 'react'; // 1. Adicione o useRef aqui
import HubLoader from './components/hub/HubLoaderComponent.jsx';
import HubHeader from './components/hub/HubHeader';
import ItemGrid from './components/item/ItemGrid';
import ItemInfo from './components/item/ItemInfo';
import EntryList from './components/item/EntryList';
import ItemViewer from './components/item/ItemViewer';
import Spinner from './components/common/Spinner';
import ErrorMessage from './components/common/ErrorMessage';
import { useItem } from './hooks/useItem';
import { remoteStorage, globalHistoryHandler } from './services/remoteStorage.js';
import Widget from 'remotestorage-widget';

import './styles/index.css';

// Função para criar as partículas (mantida do seu exemplo)
const createParticles = () => {
    const container = document.getElementById('particles-container');
    if (!container || container.childElementCount > 0) return;
    for (let i = 0; i < 20; i++) {
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
    const [selectedItemData, setSelectedItemData] = useState(null);
    const [selectedEntryKey, setSelectedEntryKey] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [readingMode, setReadingMode] = useState('paginated');
    const [sortOrder, setSortOrder] = useState('desc');
    const [isConnected, setIsConnected] = useState(false);

    const { loading: itemLoading, error: itemError, fetchItemData } = useItem();
    const [hubLoading, setHubLoading] = useState(false);
    const [hubError, setHubError] = useState(null);

    const widgetRef = useRef(null); // 2. Crie uma ref para guardar a instância do widget

    useEffect(() => {
        // Cria as partículas (mantendo a sua função original)
        createParticles();

        // 3. Verifique se o widget já foi criado antes de o inicializar
        if (!widgetRef.current) {
            const widget = new Widget(remoteStorage);
            widget.attach('remotestorage-widget');
            widgetRef.current = widget; // Guarda a instância na ref
        }

        // Define os listeners para o estado da conexão
        const handleConnectionChange = () => {
            setIsConnected(remoteStorage.connected);
        };

        remoteStorage.on('connected', handleConnectionChange);
        remoteStorage.on('disconnected', handleConnectionChange);
        
        // Verifica o estado inicial da conexão
        handleConnectionChange();

        // 4. A função de limpeza agora usa a ref
        return () => {
            remoteStorage.removeEventListener('connected', handleConnectionChange);
            remoteStorage.removeEventListener('disconnected', handleConnectionChange);
            
            // A limpeza do widget não é mais necessária aqui,
            // pois o widget persiste durante a vida da aplicação.
            // Se precisar desmontá-lo em algum momento, a lógica seria:
            // if (widgetRef.current && typeof widgetRef.current.dispose === 'function') {
            //     widgetRef.current.dispose();
            //     widgetRef.current = null;
            // }
        };
    }, []); // O array vazio [] garante que este código só é executado uma vez.


    // Corrija a sua função loadHubAndSave
    const loadHubAndSave = async (url) => {
        setHubLoading(true);
        setHubError(null);
        try {
            const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
            if (!response.ok) throw new Error(`Não foi possível carregar o hub (status: ${response.status})`);
            const data = await response.json();
            setHubData(data);

            // Salva o hub no histórico usando as instâncias importadas
            if (remoteStorage.connected && globalHistoryHandler) { // <-- Use as instâncias importadas
                const hubTitle = data.hub ? data.hub.title : "Hub Sem Título";
                const hubIconUrl = (data.hub && data.hub.icon) ? data.hub.icon.url : undefined;
                
                await globalHistoryHandler.addHub(url, hubTitle, hubIconUrl);
            }

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
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
        setCurrentPage(0);
    };

    const getEntryKeys = () => {
        if (!selectedItemData || !selectedItemData.entries) return [];
        const keys = Object.keys(selectedItemData.entries);
        return sortOrder === 'asc' ? keys.sort((a, b) => a - b) : keys.sort((a, b) => b - a);
    };

    if (hubLoading || itemLoading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
    if (hubError) return <div className="min-h-screen flex items-center justify-center"><ErrorMessage message={`Erro ao carregar hub: ${hubError}`} /></div>;

    const entryKeys = currentHubData ? getEntryKeys() : [];
    const currentEntryIndex = currentHubData ? entryKeys.indexOf(selectedEntryKey) : -1;

    return (
        <div className="min-h-screen flex flex-col">
            <div className="animated-bg"></div>
            <div id="particles-container"></div>

            <main className="flex-grow flex flex-col">
                {!currentHubData ? (
                    <div className="flex-grow flex items-center justify-center p-4 min-h-screen">
                        {/* A prop onLoadHub foi atualizada para loadHubAndSave */}
                        <HubLoader
                            onLoadHub={loadHubAndSave}
                            loading={hubLoading}
                        />
                    </div>
                ) : (
                    <div className="container mx-auto px-4 py-8">
                        {!selectedItemData ? (
                            <>
                                <HubHeader hub={currentHubData.hub} />
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
                                totalPages={selectedItemData.entries[selectedEntryKey].pages.length}
                                currentPageIndex={currentPage}
                                onNextPage={() => setCurrentPage(prev => Math.min(prev + 1, selectedItemData.entries[selectedEntryKey].pages.length - 1))}
                                onPrevPage={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                onNextEntry={() => {
                                    const nextIndex = currentEntryIndex + 1;
                                    if (nextIndex < entryKeys.length) {
                                        selectEntry(entryKeys[nextIndex]);
                                    }
                                }}
                                onPrevEntry={() => {
                                    const prevIndex = currentEntryIndex - 1;
                                    if (prevIndex >= 0) {
                                        selectEntry(entryKeys[prevIndex]);
                                    }
                                }}
                            />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
