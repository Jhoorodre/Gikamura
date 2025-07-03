// AIDEV-NOTE: Main App component; routing, notifications, and global state management
import { useRef, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import { useRemoteStorageContext } from './context/RemoteStorageContext';
import { useServiceWorker } from './hooks/useServiceWorker';
import { useNetworkNotifications } from './hooks/useNetworkMonitor';
import { useHubLoader } from './hooks/useHubLoader';
import ItemDetailView from './views/ItemDetailView';
import ReaderView from './views/ReaderView';
import ChapterReaderView from './views/ChapterReaderView';
import Spinner from './components/common/Spinner';
import ErrorMessage from './components/common/ErrorMessage';
import RedirectPage from './pages/RedirectPage';
import { createParticles } from './utils/particles.js';
import MainContent from './components/common/MainContent';
import HubRouteHandler from './views/HubRouteHandler';
import CollectionPage from './pages/CollectionPage';
import WorksPage from './pages/WorksPage';
import UploadPage from './pages/UploadPage';
import SeriesDetailPage from './pages/SeriesDetailPage';
import ArrowNavigation from './components/common/ArrowNavigation';
import GlobalRemoteStorageWidget from './components/common/SimpleRemoteStorageWidgetNew';
import Header from './components/common/Header';
import { runFullDiagnostic } from './utils/networkDebug';

function App() {
    const { conflictMessage: appConflictMessage } = useAppContext();
    const { isConnected: remoteStorageConnected, isSyncing, conflictMessage } = useRemoteStorageContext();
    const { isOnline, updateAvailable, applyUpdate } = useServiceWorker();
    const { networkMessage, dismissSlowMessage } = useNetworkNotifications();
    
    // AIDEV-NOTE: Centralized hub loading without auto-loading to prevent loops
    const { url: hubUrl, setUrl: setHubUrl, loading, handleSubmit: handleLoadHub } = useHubLoader();

    useEffect(() => {
        createParticles();
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
            
            {/* AIDEV-NOTE: Global components always present */}
            <ArrowNavigation />
            <GlobalRemoteStorageWidget />
            
            {/* AIDEV-NOTE: Smart network notifications system */}
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
            
            {/* AIDEV-NOTE: System status indicators */}
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
            {appConflictMessage && (
                <div className="conflict-indicator">
                    <ErrorMessage message={appConflictMessage} />
                </div>
            )}

            {/* AIDEV-NOTE: Unified routing system with conditional rendering */}
            <Routes>
                {/* AIDEV-NOTE: Main route switches based on RemoteStorage connection */}
                <Route path="/" element={
                    !remoteStorageConnected ? (
                        /* AIDEV-NOTE: Mode 1: No RemoteStorage - always uses MainContent */
                        <main className="flex-grow flex flex-col">
                            <div className="container mx-auto px-4 py-8 w-full">
                                <MainContent />
                            </div>
                        </main>
                    ) : (
                        /* AIDEV-NOTE: Mode 2: With RemoteStorage */
                        <main className="flex-grow flex flex-col">
                            <div className="container mx-auto px-4 py-8 w-full">
                                <MainContent />
                            </div>
                        </main>
                    )
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
                <Route path="/read/:encodedUrl/:chapterId" element={<ChapterReaderView />} />
                <Route path="/series/:encodedUrl" element={<SeriesDetailPage />} />
                <Route path="/series/:encodedId" element={<ItemDetailView />} />
                <Route path="/read/:encodedSeriesId/:encodedEntryKey" element={<ReaderView />} />
                <Route path="/redirect/:base64Url" element={<RedirectPage />} />
            </Routes>
        </div>
    );
}

export default App;
