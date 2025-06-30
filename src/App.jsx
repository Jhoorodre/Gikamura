import React, { useEffect, useRef, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import HubLoader from './components/hub/HubLoaderComponent.jsx';
import Widget from 'remotestorage-widget';
import HubView from './views/HubView';
import ItemDetailView from './views/ItemDetailView';
import ReaderView from './views/ReaderView';
import Spinner from './components/common/Spinner';
import ErrorMessage from './components/common/ErrorMessage';
import { remoteStorage } from './services/remoteStorage';
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
    const {
        currentHubData,
        hubLoading,
        hubError,
        loadHub,
        isSyncing,
        conflictMessage,
        offline: isOffline
    } = useAppContext();
    const widgetRef = useRef(null);

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
                    {hubLoading && <Spinner />}
                    {hubError && <ErrorMessage message={hubError} onRetry={() => loadHub()} />}
                    {!hubLoading && !hubError && (
                        !currentHubData
                            ? <HubLoader onLoadHub={loadHub} />
                            : (
                                <Routes>
                                    <Route path="/" element={<HubView />} />
                                    <Route path="/series/:slug" element={<ItemDetailView />} />
                                    <Route path="/series/:slug/read/:entryKey" element={<ReaderView />} />
                                </Routes>
                            )
                    )}
                </div>
            </main>
        </div>
    );
}

export default App;
