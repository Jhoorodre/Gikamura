import React, { useEffect, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
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
import { createParticles } from './utils/particles.js';
import MainContent from './components/common/MainContent';

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
    const location = useLocation();
    const navigate = useNavigate();
    const widgetRef = useRef(null);
    const processedUrl = useRef(false);

    // Efeito para carregar hub.json a partir do parâmetro base64 no hash
    useEffect(() => {
        if (processedUrl.current) return;

        const hash = window.location.hash;
        const urlParams = new URLSearchParams(hash.substring(hash.indexOf('?')));
        const hubFromUrl = urlParams.get('hub');

        if (hubFromUrl) {
            processedUrl.current = true;
            const loadHubFromUrl = async () => {
                try {
                    const decodedUrl = atob(hubFromUrl);
                    // 1. Espera a função 'loadHub' terminar completamente.
                    //    Isto é crucial. 'loadHub' deve ser uma função 'async'.
                    await loadHub(decodedUrl);
                } catch (e) {
                    console.error("Falha ao carregar o hub a partir da URL:", e);
                } finally {
                    // 2. APÓS o sucesso (ou falha) do carregamento, limpamos a URL.
                    //    O 'finally' garante que isto acontece sempre.
                    navigate('/', { replace: true });
                }
            };
            loadHubFromUrl();
        }
    }, [location, loadHub, navigate]);

    useEffect(() => {
        createParticles();
        if (!widgetRef.current) {
            const widget = new Widget(remoteStorage);
            widget.attach('remotestorage-widget');
            widgetRef.current = widget;
        }
        // Recria as partículas ao mudar de rota para garantir que a animação
        // não seja interrompida por renderizações de componentes.
        createParticles();
    }, [location.pathname]);
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
                        {/* Rota de redirecionamento sempre disponível */}
                        <Route path="/redirect/:base64Url" element={<RedirectPage />} />

                        {/* Rotas principais da aplicação */}
                        <Route path="/" element={<MainContent />} />
                        <Route path="/series/:slug" element={<ItemDetailView />} />
                        <Route path="/series/:slug/read/:entryKey" element={<ReaderView />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}

export default App;
