// AIDEV-NOTE: Main App component; routing, notifications, and global state management
import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import { useRemoteStorageContext } from './context/RemoteStorageContext';
import { useServiceWorker } from './hooks/useServiceWorker';
// import { useNetworkNotifications } from './hooks/useNetworkMonitor'; // AIDEV-NOTE: Disabled to remove network messages
import { useHubLoader } from './hooks/useHubLoader';
import { createParticles } from './utils/particles.js';
import MainContent from './components/common/MainContent';
import HubRouteHandler from './views/HubRouteHandler';
import CollectionPage from './pages/CollectionPage';
import WorksPage from './pages/WorksPage';
import UploadPage from './pages/UploadPage';
import SeriesDetailPage from './pages/SeriesDetailPage';
import ItemDetailView from './views/ItemDetailView';
import ReaderView from './views/ReaderView';
import ChapterReaderView from './views/ChapterReaderView';
import RedirectPage from './pages/RedirectPage';
import ErrorMessage from './components/common/ErrorMessage';
import GlobalRemoteStorageWidget from './components/common/SimpleRemoteStorageWidgetNew';
import Header from './components/common/Header';
import { runFullDiagnostic } from './utils/networkDebug';

function App() {
    const { conflictMessage: appConflictMessage } = useAppContext();
    const { isConnected: remoteStorageConnected, conflictMessage } = useRemoteStorageContext();
    const { updateAvailable, applyUpdate } = useServiceWorker();
    // const { networkMessage, dismissSlowMessage } = useNetworkNotifications(); // AIDEV-NOTE: Disabled to remove network messages
    
    // AIDEV-NOTE: Sync overlay temporarily disabled
    // const { isConnected: remoteStorageConnected, isSyncing, conflictMessage } = useRemoteStorageContext();
    // const { showOverlay: showSyncOverlay, forceHide: forcHideSyncOverlay } = useSyncOverlay(isSyncing);
    
    // AIDEV-NOTE: Centralized hub loading without auto-loading to prevent loops
    const { url: _hubUrl, setUrl: _setHubUrl, loading: _loading, handleSubmit: _handleLoadHub } = useHubLoader();

    useEffect(() => {
        // AIDEV-NOTE: Create particles after DOM is ready
        setTimeout(() => {
            createParticles();
        }, 100);
        console.log('🚀 [App] Aplicação iniciada - Remote Storage conectado:', remoteStorageConnected);
    }, []); // AIDEV-NOTE: Fixed deps to prevent infinite loops

    // AIDEV-NOTE: One-time network diagnostic in dev mode only
    useEffect(() => {
        const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
        if (isDevelopment) {
            console.log('🩺 [App] Executando diagnóstico de rede uma única vez...');
            runFullDiagnostic().then(() => {
                console.log('✅ [App] Diagnóstico completo finalizado');
            }).catch(error => {
                console.error('❌ [App] Erro no diagnóstico:', error);
            });
        }
    }, []); // AIDEV-NOTE: Runs only once on mount

    return (
        <div className="min-h-screen flex flex-col">
            {/* AIDEV-NOTE: Main application header with navigation */}
            <Header />
            
            {/* AIDEV-NOTE: Sistema de navegação antigo removido - ArrowNavigation.jsx deletado definitivamente */}
            {/* AIDEV-NOTE: Global RemoteStorage widget (essential functionality, not part of old nav) */}
            <GlobalRemoteStorageWidget />
            
            {/* AIDEV-NOTE: Network notifications system - DISABLED to remove "Carregando dados" message */}
            {/* {networkMessage && (
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
            )} */}
            
            {/* AIDEV-NOTE: Update notification with user action */}
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
            
            {/* AIDEV-NOTE: System status indicators with controlled display */}
            {/* AIDEV-NOTE: Sync overlay temporarily disabled - causing persistent display issues
            {showSyncOverlay && (
                <div className="sync-indicator">
                    <div className="flex items-center gap-3">
                        <Spinner size="sm" text="Sincronizando..." />
                        <button 
                            onClick={forcHideSyncOverlay}
                            className="text-xs text-gray-500 hover:text-gray-700 underline"
                            title="Ocultar overlay de sincronização"
                        >
                            Ocultar
                        </button>
                    </div>
                </div>
            )}
            */}
            {conflictMessage && (
                <div className="conflict-indicator">
                    <ErrorMessage message={conflictMessage} />
                </div>
            )}
            {appConflictMessage && (
                <div className="conflict-indicator">
                    <ErrorMessage message={appConflictMessage} />
                </div>
            )}

            {/* AIDEV-NOTE: Unified routing system with conditional rendering */}
            <Routes>
                {/* AIDEV-NOTE: Main route - unified content for all connection states */}
                <Route path="/" element={
                    <main className="flex-grow flex flex-col">
                        <div className="container mx-auto px-4 py-8 w-full">
                            <MainContent />
                        </div>
                    </main>
                } />
                
                {/* AIDEV-NOTE: Protected routes requiring RemoteStorage connection */}
                <Route path="/collection" element={
                    remoteStorageConnected ? <CollectionPage /> : 
                    <div className="page-container">
                        <div className="empty-state">
                            <span className="empty-state-icon">🔐</span>
                            <h2 className="empty-state-title">Remote Storage Necessário</h2>
                            <p className="empty-state-description">
                                Para acessar sua coleção, conecte-se ao Remote Storage.
                            </p>
                        </div>
                    </div>
                } />
                <Route path="/works" element={
                    remoteStorageConnected ? <WorksPage /> : 
                    <div className="page-container">
                        <div className="empty-state">
                            <span className="empty-state-icon">🔐</span>
                            <h2 className="empty-state-title">Remote Storage Necessário</h2>
                            <p className="empty-state-description">
                                Para acessar suas obras, conecte-se ao Remote Storage.
                            </p>
                        </div>
                    </div>
                } />
                <Route path="/upload" element={
                    remoteStorageConnected ? <UploadPage /> : 
                    <div className="page-container">
                        <div className="empty-state">
                            <span className="empty-state-icon">🔐</span>
                            <h2 className="empty-state-title">Remote Storage Necessário</h2>
                            <p className="empty-state-description">
                                Para fazer upload de conteúdo, conecte-se ao Remote Storage.
                            </p>
                        </div>
                    </div>
                } />

                {/* AIDEV-NOTE: Global routes always available regardless of connection */}
                <Route path="/hub/:encodedUrl" element={<HubRouteHandler />} />
                <Route path="/reader/:encodedUrl" element={<ReaderView />} />
                <Route path="/series/:encodedUrl" element={<SeriesDetailPage />} />
                <Route path="/read/:encodedUrl/:chapterId" element={<ChapterReaderView />} />
                <Route path="/redirect/:base64Url" element={<RedirectPage />} />

                {/* Rota de fallback para conteúdo legado ou IDs antigos */}
                <Route path="/series/:encodedId" element={<ItemDetailView />} />
            </Routes>
        </div>
    );
}

export default App;
