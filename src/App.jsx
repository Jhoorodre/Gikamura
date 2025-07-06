// AIDEV-NOTE: Main App component; routing, notifications, and global state management
import { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import { useRemoteStorageContext } from './context/RemoteStorageContext';
import { useServiceWorker } from './hooks/useServiceWorker';
// import { useNetworkNotifications } from './hooks/useNetworkMonitor'; // AIDEV-NOTE: Disabled to remove network messages
import { useHubLoader } from './hooks/useHubLoader';
import { createParticles } from './utils/particles.js';
import MainContent from './components/common/MainContent';
import RedirectPage from './pages/RedirectPage';
import ErrorMessage from './components/common/ErrorMessage';
import GlobalRemoteStorageWidget from './components/common/SimpleRemoteStorageWidgetNew';
import Header from './components/common/Header';
import { runFullDiagnostic } from './utils/networkDebug';
import Spinner from './components/common/Spinner';
import { HubProvider } from './context/HubContext';
import { UserPreferencesProvider } from './context/UserPreferencesContext';

// AIDEV-NOTE: Rotas pesadas agora são carregadas sob demanda (React.lazy)
const ReaderView = lazy(() => import('./views/ReaderView'));
const ChapterReaderView = lazy(() => import('./views/ChapterReaderView'));
const SeriesDetailPage = lazy(() => import('./pages/SeriesDetailPage'));
const ItemDetailView = lazy(() => import('./views/ItemDetailView'));
const HubView = lazy(() => import('./views/HubView'));
const HubRouteHandler = lazy(() => import('./views/HubRouteHandler'));
// AIDEV-NOTE: Páginas protegidas também em lazy loading
const CollectionPage = lazy(() => import('./pages/CollectionPage'));
const WorksPage = lazy(() => import('./pages/WorksPage'));
const UploadPage = lazy(() => import('./pages/UploadPage'));

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

    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        // AIDEV-NOTE: Delay curto para garantir que o contexto de conexão seja resolvido antes de renderizar
        setLoading(true);
        const timer = setTimeout(() => {
            setLoading(false);
        }, 50);
        return () => clearTimeout(timer);
    }, [location.pathname]);

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

    // AIDEV-NOTE: Tela de carregamento enquanto verifica conexão RemoteStorage
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <Spinner size="lg" text="Carregando..." />
            </div>
        );
    }

    return (
        <UserPreferencesProvider>
            <HubProvider>
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

                    {/* AIDEV-NOTE: Unified routing system with conditional rendering e code splitting dinâmico */}
                    <Routes>
                        {/* AIDEV-NOTE: Main route - unified content for all connection states */}
                        <Route path="/" element={
                            <main className="flex-grow flex flex-col">
                                <div className="container mx-auto px-4 py-8 w-full">
                                    <MainContent />
                                </div>
                            </main>
                        } />
                        
                        {/* AIDEV-NOTE: Protected routes requiring RemoteStorage connection e lazy loading */}
                        <Route path="/collection" element={
                            <Suspense fallback={<Spinner text="Carregando coleção..." />}>
                                {remoteStorageConnected ? <CollectionPage /> : 
                                    <div className="page-container">
                                        <div className="empty-state">
                                            <span className="empty-state-icon">🔐</span>
                                            <h2 className="empty-state-title">Remote Storage Necessário</h2>
                                            <p className="empty-state-description">
                                                Para acessar sua coleção, conecte-se ao Remote Storage.
                                            </p>
                                        </div>
                                    </div>
                                }
                            </Suspense>
                        } />
                        <Route path="/works" element={
                            <Suspense fallback={<Spinner text="Carregando obras..." />}>
                                {remoteStorageConnected ? <WorksPage /> : 
                                    <div className="page-container">
                                        <div className="empty-state">
                                            <span className="empty-state-icon">🔐</span>
                                            <h2 className="empty-state-title">Remote Storage Necessário</h2>
                                            <p className="empty-state-description">
                                                Para acessar suas obras, conecte-se ao Remote Storage.
                                            </p>
                                        </div>
                                    </div>
                                }
                            </Suspense>
                        } />
                        <Route path="/upload" element={
                            <Suspense fallback={<Spinner text="Carregando upload..." />}>
                                {remoteStorageConnected ? <UploadPage /> : 
                                    <div className="page-container">
                                        <div className="empty-state">
                                            <span className="empty-state-icon">🔐</span>
                                            <h2 className="empty-state-title">Remote Storage Necessário</h2>
                                            <p className="empty-state-description">
                                                Para fazer upload de conteúdo, conecte-se ao Remote Storage.
                                            </p>
                                        </div>
                                    </div>
                                }
                            </Suspense>
                        } />

                        {/* AIDEV-NOTE: Global routes sempre disponíveis, agora com Suspense para carregamento dinâmico */}
                        <Route path="/hub/:encodedUrl" element={
                            <Suspense fallback={<Spinner text="Carregando página do hub..."/>}>
                                <HubRouteHandler />
                            </Suspense>
                        } />
                        <Route path="/reader/:encodedUrl" element={
                            <Suspense fallback={<Spinner text="Carregando leitor..." />}>
                                <ReaderView />
                            </Suspense>
                        } />
                        <Route path="/series/:encodedUrl" element={
                            <Suspense fallback={<Spinner text="Carregando série..." />}>
                                <SeriesDetailPage />
                            </Suspense>
                        } />
                        <Route path="/read/:encodedUrl/:chapterId" element={
                            <Suspense fallback={<Spinner text="Carregando capítulo..." />}>
                                <ChapterReaderView />
                            </Suspense>
                        } />
                        <Route path="/redirect/:base64Url" element={<RedirectPage />} />

                        {/* Rota de fallback para conteúdo legado ou IDs antigos */}
                        <Route path="/series/:encodedId" element={
                            <Suspense fallback={<Spinner text="Carregando detalhes..." />}>
                                <ItemDetailView />
                            </Suspense>
                        } />
                    </Routes>
                </div>
            </HubProvider>
        </UserPreferencesProvider>
    );
}

export default App;
