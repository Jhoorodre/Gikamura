import React, { useState, useEffect, useRef, Suspense } from 'react';
import HubLoader from './components/hub/HubLoaderComponent.jsx';
import Widget from 'remotestorage-widget';
import { useHistory } from './context/HistoryContext';

import { useItem } from './hooks/useItem';
import { remoteStorage, globalHistoryHandler } from './services/remoteStorage.js';
import { fetchData } from './services/api';
import './styles/index.css';
import HubView from './views/HubView';
import ItemDetailView from './views/ItemDetailView';
import ReaderView from './views/ReaderView';
import Spinner from './components/common/Spinner';

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

    const { loading: itemLoading, error: itemError, fetchItemData, offline, offlineError } = useItem();
    const [hubLoading, setHubLoading] = useState(false);
    const [hubError, setHubError] = useState(null);

    const widgetRef = useRef(null); // 2. Crie uma ref para guardar a instância do widget
    const { isConnected: historyIsConnected, savedHubs, addHub, removeHub, loadSavedHubs } = useHistory(); // Contexto HistoryContext

    // Estado para capítulos lidos
    const [readChapters, setReadChapters] = useState([]);

    // Estado para busca de séries
    const [searchTerm, setSearchTerm] = useState("");

    // Estado para detectar modo offline
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

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
            const data = await fetchData(url);
            sessionStorage.setItem(url, JSON.stringify(data));
            setHubData(data);
            if (remoteStorage.connected && globalHistoryHandler) {
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
        // Se offline, tenta buscar do cache
        const completeItemData = await fetchItemData(itemObject, isOffline);
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
        if (remoteStorage.connected && selectedItemData) {
            globalHistoryHandler.getLastReadPage(selectedItemData.slug, selectedItemData.source?.id)
                .then(lastRead => {
                    if (lastRead && lastRead.chapterKey === entryKey) {
                        setCurrentPage(lastRead.page);
                    } else {
                        setCurrentPage(0);
                    }
                    setSelectedEntryKey(entryKey);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
        } else {
            setCurrentPage(0);
            setSelectedEntryKey(entryKey);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
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

    // Função para pinar/despinar série
    const handlePinToggle = async (item) => {
        if (!item.slug || !item.source?.id) return;
        if (item.pinned) {
            await globalHistoryHandler.unpinSeries(item.slug, item.source.id);
        } else {
            await globalHistoryHandler.pinSeries(item.slug, item.cover?.url, item.source.id, item.url, item.title);
        }
        // Atualiza a lista após pin/unpin
        setHubData((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                series: prev.series.map(s =>
                    s.slug === item.slug && s.source?.id === item.source?.id
                        ? { ...s, pinned: !item.pinned }
                        : s
                )
            };
        });
    };

    // Filtra as séries com base no termo de busca
    const filteredSeries = currentHubData?.series.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const renderContent = () => {
        if (hubLoading) {
            return <div className="flex justify-center items-center h-64"><Spinner /></div>;
        }
        if (!currentHubData) {
            return <HubLoader onLoadHub={loadHubAndSave} loading={hubLoading} error={hubError} />;
        }
        if (!selectedItemData) {
            return (
                <HubView
                    hub={currentHubData.hub}
                    series={filteredSeries}
                    onSelectItem={selectItem}
                    searchTerm={searchTerm}
                    onSearchChange={e => setSearchTerm(e.target.value)}
                />
            );
        }
        if (!selectedEntryKey) {
            if (itemLoading) {
                return <div className="flex justify-center items-center h-64"><Spinner /></div>;
            }
            if (itemError) {
                return <ErrorMessage message={itemError} onRetry={() => selectItem(selectedItemData)} />;
            }
            return (
                <ItemDetailView
                    item={selectedItemData}
                    onBack={backToHub}
                    onSelectEntry={selectEntry}
                    readChapters={readChapters}
                />
            );
        }
        return <ReaderView
            itemData={{...selectedItemData, selectedEntryKey, source: { id: selectedItemData.source?.id }}}
            entry={selectedItemData.entries[selectedEntryKey]}
            page={currentPage}
            setPage={setCurrentPage}
            onBack={backToItem}
            readingMode={readingMode}
            setReadingMode={setReadingMode}
            isFirstEntry={currentEntryIndex === 0}
            isLastEntry={currentEntryIndex === entryKeys.length - 1}
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
        />;
    };

    return (
        <div className="min-h-screen flex flex-col">
            {isOffline && (
                <div className="bg-yellow-200 text-yellow-900 text-center py-2 font-semibold z-50">
                    Você está offline. Apenas conteúdo já carregado estará disponível.
                </div>
            )}
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
                <div className="container mx-auto px-4 py-8 w-full">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}

export default App;
