import React, { useRef, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import HubLoader from './components/hub/HubLoaderComponent.jsx';
import Widget from 'remotestorage-widget';
import HubView from './views/HubView';
import ItemDetailView from './views/ItemDetailView';
import ReaderView from './views/ReaderView';
import Spinner from './components/common/Spinner';
import ErrorMessage from './components/common/ErrorMessage';
import { remoteStorage } from './services/remotestorage';
import RedirectPage from './pages/RedirectPage';
import HubLoaderPage from './pages/HubLoaderPage';
import { createParticles } from './utils/particles.js';
import MainContent from './components/common/MainContent';
import HubRouteHandler from './views/HubRouteHandler';

function App() {
    const {
        isSyncing,
        conflictMessage,
        isOffline
    } = useAppContext();
    const location = useLocation();
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
                    <Routes>
                        {/* Rota principal que exibe o conteúdo ou o formulário */}
                        <Route path="/" element={<MainContent />} />
                        {/* Nova rota para carregar o Hub */}
                        <Route path="/hub/:encodedUrl" element={<HubRouteHandler />} />
                        {/* ROTA DA SÉRIE ATUALIZADA */}
                        <Route path="/series/:encodedId" element={<ItemDetailView />} />
                        {/* ROTA DO LEITOR ATUALIZADA */}
                        <Route path="/read/:encodedSeriesId/:encodedEntryKey" element={<ReaderView />} />
                        <Route path="/redirect/:base64Url" element={<RedirectPage />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}

export default App;
