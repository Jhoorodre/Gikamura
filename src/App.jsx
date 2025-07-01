import { useRef, useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import { useRemoteStorageContext } from './context/RemoteStorageContext';
import { useServiceWorker } from './hooks/useServiceWorker';
import { useNetworkNotifications } from './hooks/useNetworkMonitor';
import ItemDetailView from './views/ItemDetailView';
import ReaderView from './views/ReaderView';
import Spinner from './components/common/Spinner';
import ErrorMessage from './components/common/ErrorMessage';
import RedirectPage from './pages/RedirectPage';
import { createParticles } from './utils/particles.js';
import MainContent from './components/common/MainContent';
import HubRouteHandler from './views/HubRouteHandler';
import CollectionPage from './pages/CollectionPage';
import WorksPage from './pages/WorksPage';
import UploadPage from './pages/UploadPage';
import ArrowNavigation from './components/common/ArrowNavigation';
import GlobalRemoteStorageWidget from './components/common/SimpleRemoteStorageWidgetNew';
import RemoteStorageDebug from './components/common/RemoteStorageDebug';
import { encodeUrl } from './utils/encoding';

function App() {
    const {
        isSyncing,
        conflictMessage
    } = useAppContext();
    
    const { isConnected } = useRemoteStorageContext();
    const { isOnline, updateAvailable, applyUpdate } = useServiceWorker();
    const { networkMessage, dismissSlowMessage } = useNetworkNotifications();
    const navigate = useNavigate();
    const [hubUrl, setHubUrl] = useState("https://raw.githubusercontent.com/Jhoorodre/TOG-Brasil/refs/heads/main/hub_tog.json");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        createParticles();
    }, []);

    const handleLoadHub = (e) => {
        e.preventDefault();
        if (!hubUrl.trim()) return;
        
        setLoading(true);
        try {
            const encodedHubUrl = encodeUrl(hubUrl.trim());
            navigate(`/hub/${encodedHubUrl}`);
        } catch (error) {
            console.error("Falha ao codificar a URL do hub:", error);
            setLoading(false);
        }
    };

    // Mostrar apenas placeholder e widget se não estiver conectado
    if (!isConnected) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-900 text-white">
                <GlobalRemoteStorageWidget />
                
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-6 max-w-md mx-auto px-6">
                        <h1 className="text-4xl font-bold text-white mb-4">
                            Gikamoe
                        </h1>
                        
                        <div className="space-y-3">
                            <p className="text-gray-300 text-lg">
                                Conecte-se ao Remote Storage ou cole um link JSON
                            </p>
                            <p className="text-gray-400 text-sm">
                                Cole o link direto do arquivo JSON
                            </p>
                        </div>

                        {/* Formulário para carregar hub via JSON */}
                        <form onSubmit={handleLoadHub} className="w-full space-y-4">
                            <input
                                type="text"
                                value={hubUrl}
                                onChange={(e) => setHubUrl(e.target.value)}
                                placeholder="https://raw.githubusercontent.com/..."
                                className="w-full p-3 bg-gray-800 rounded-lg border border-gray-600 focus:border-blue-500 transition-all duration-300 text-white placeholder-gray-400"
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                disabled={loading || !hubUrl.trim()}
                                className="w-full p-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Carregando...' : 'Acessar Hub'}
                            </button>
                        </form>

                        <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                            <p className="text-gray-400 text-xs">
                                Remote Storage permite sincronizar seus dados entre dispositivos de forma segura e privada.
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Debug do RemoteStorage - apenas em desenvolvimento */}
                {process.env.NODE_ENV === 'development' && <RemoteStorageDebug />}
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <ArrowNavigation />
            <GlobalRemoteStorageWidget />
            <RemoteStorageDebug />
            
            {/* Notificações de Rede Inteligentes */}
            {networkMessage && (
                <div className={`text-center py-2 font-semibold z-50 ${
                    networkMessage.type === 'offline' ? 'bg-red-600 text-white' :
                    networkMessage.type === 'recovering' ? 'bg-blue-600 text-white' :
                    networkMessage.type === 'slow' ? 'bg-yellow-600 text-black' :
                    'bg-gray-600 text-white'
                }`}>
                    <span>{networkMessage.message}</span>
                    {networkMessage.action && (
                        <button 
                            onClick={dismissSlowMessage}
                            className="ml-4 underline hover:no-underline"
                        >
                            {networkMessage.action}
                        </button>
                    )}
                </div>
            )}
            
            {/* Notificação de Atualização */}
            {updateAvailable && (
                <div className="bg-blue-200 text-blue-900 text-center py-2 font-semibold z-50">
                    <span>Nova versão disponível! </span>
                    <button 
                        onClick={applyUpdate}
                        className="underline hover:no-underline"
                    >
                        Clique para atualizar
                    </button>
                </div>
            )}
            
            <div className="animated-bg"></div>
            <div id="particles-container"></div>
            
            {/* Indicadores de Sistema */}
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
                        {/* ROTA DA COLEÇÃO */}
                        <Route path="/collection" element={<CollectionPage />} />
                        {/* ROTA DAS OBRAS */}
                        <Route path="/works" element={<WorksPage />} />
                        {/* ROTA DO UPLOAD */}
                        <Route path="/upload" element={<UploadPage />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}

export default App;
