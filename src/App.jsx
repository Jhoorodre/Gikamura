import React, { useState, useEffect, useRef, Suspense } from 'react';
import HubLoader from './components/hub/HubLoaderComponent.jsx';
import HubHeader from './components/hub/HubHeader';
import ItemGrid from './components/item/ItemGrid';
import ItemInfo from './components/item/ItemInfo';
import EntryList from './components/item/EntryList';
const ItemViewer = React.lazy(() => import('./components/item/ItemViewer.jsx'));
import ItemGridSkeleton from './components/item/ItemGridSkeleton.jsx';
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
    const [isSyncing, setIsSyncing] = useState(false); // 1. Estado para controlar a sincronização
    const [conflictMessage, setConflictMessage] = useState(null);

    const { loading: itemLoading, error: itemError, fetchItemData } = useItem();
    const [hubLoading, setHubLoading] = useState(false);
    const [hubError, setHubError] = useState(null);

    const widgetRef = useRef(null); // 2. Crie uma ref para guardar a instância do widget

    // Estado para capítulos lidos
    const [readChapters, setReadChapters] = useState([]);

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

        const handleSyncReqDone = () => setIsSyncing(true); // 4. Handler para início da sincronização
        const handleSyncDone = () => setIsSyncing(false); // 5. Handler para fim da sincronização

        remoteStorage.on('sync-req-done', handleSyncReqDone); // 6. Adiciona o listener para sync-req-done
        remoteStorage.on('sync-done', handleSyncDone); // 7. Adiciona o listener para sync-done

        const handleConflict = (conflictEvent) => {
            console.warn("Conflito detectado!", conflictEvent);
            setConflictMessage("Detectamos um conflito de dados. A versão mais recente foi mantida.");
            setTimeout(() => setConflictMessage(null), 7000); // Mensagem some após 7s
        };
        remoteStorage.on('conflict', handleConflict);

        // Verifica o estado inicial da conexão
        handleConnectionChange();

        // 4. A função de limpeza agora usa a ref
        return () => {
            remoteStorage.removeEventListener('connected', handleConnectionChange);
            remoteStorage.removeEventListener('disconnected', handleConnectionChange);
            remoteStorage.removeEventListener('sync-req-done', handleSyncReqDone); // 8. Remove o listener para sync-req-done
            remoteStorage.removeEventListener('sync-done', handleSyncDone); // 9. Remove o listener para sync-done
            remoteStorage.removeEventListener('conflict', handleConflict);
        };
    }, []); // O array vazio [] garante que este código só é executado uma vez.


    // Corrija a sua função loadHubAndSave
    const loadHubAndSave = async (url) => {
        setHubLoading(true);
        setHubError(null);

        // Tenta carregar do cache primeiro
        const cachedHub = sessionStorage.getItem(url);
        if (cachedHub) {
            console.log("Hub carregado do cache!");
            setHubData(JSON.parse(cachedHub));
            setHubLoading(false);
            return;
        }

        try {
            const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
            if (!response.ok) throw new Error(`Não foi possível carregar o hub (status: ${response.status})`);
            const data = await response.json();
            // Salva no cache após o sucesso
            sessionStorage.setItem(url, JSON.stringify(data));
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
            // Carrega capítulos lidos
            if (remoteStorage.connected) {
                globalHistoryHandler.getReadChapters(itemObject.slug, itemObject.source?.id)
                    .then(chapters => setReadChapters(chapters || []));
            } else {
                setReadChapters([]);
            }
        }
    };

    const selectEntry = (entryKey) => {
        setSelectedEntryKey(entryKey);
        setCurrentPage(0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Salva capítulo como lido
        if (remoteStorage.connected && selectedItemData) {
            globalHistoryHandler.addChapter(selectedItemData.slug, selectedItemData.source?.id, entryKey)
                .then(() => {
                    setReadChapters(prev => [...new Set([...prev, entryKey])]);
                });
        }
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
            {isSyncing && (
                <div className="sync-indicator">
                    <Spinner size="sm" text="Sincronizando..." />
                </div>
            )}
            {conflictMessage && (
                <div className="conflict-indicator">
                    <ErrorMessage message={conflictMessage} />
                </div>
            )}
            <main className="flex-grow flex flex-col">
                {!currentHubData ? (
                    <div className="flex-grow flex items-center justify-center p-4">
                        <HubLoader
                            onLoadHub={loadHubAndSave}
                            loading={hubLoading}
                        />
                    </div>
                ) : (
                    <div className="container mx-auto px-4 py-8 w-full">
                        <div className="view-container" key={selectedItemData ? 'item-view' : 'hub-view'}>
                        {!selectedItemData ? (
                            <>
                                <HubHeader hub={currentHubData.hub} />
                                {itemLoading ? (
                                    <ItemGridSkeleton />
                                ) : (
                                    <ItemGrid items={currentHubData.series} onSelectItem={selectItem} />
                                )}
                            </>
                        ) : !selectedEntryKey ? (
                            <>
                                <ItemInfo itemData={selectedItemData} onBackToHub={backToHub} />
                                <EntryList
                                    itemData={selectedItemData}
                                    onSelectEntry={selectEntry}
                                    sortOrder={sortOrder}
                                    setSortOrder={setSortOrder}
                                    readChapters={readChapters}
                                />
                            </>
                        ) : (
                            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
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
                            </Suspense>
                        )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
