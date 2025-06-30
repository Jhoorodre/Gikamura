import React, { useEffect, useRef } from 'react';
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
        isOffline,
        isConnected
    } = useAppContext();
    const widgetRef = useRef(null);
    useEffect(() => {
        createParticles();
        if (!widgetRef.current) {
            const widget = new Widget(remoteStorage);
            widget.attach('remotestorage-widget');
            widgetRef.current = widget;
        }
    }, []);
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
                    {hubError && <ErrorMessage message={hubError} onRetry={() => currentHubData && loadHub(currentHubData.url)} />}
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
