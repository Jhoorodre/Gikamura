// AIDEV-NOTE: Main App component; routing, notifications, and global state management
// AIDEV-NOTE: ANTI-FLICKERING IMPROVEMENTS:
// 1. Removed route-based loading state that caused flickering on every navigation
// 2. Optimized Suspense fallbacks to be transparent instead of visible loading states
// 3. Added PageTransition component for smooth route changes
// 4. Memoized context values to prevent unnecessary re-renders
// 5. Added anti-flicker CSS for smooth visual transitions
import { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
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
import MainLayout from './components/common/MainLayout';
import { ReaderToMangaRedirect, LeitorToReaderRedirect } from './components/common/RouteRedirects';

// AIDEV-NOTE: Rotas pesadas agora são carregadas sob demanda (React.lazy)
const HubView = lazy(() => import('./views/HubView'));
const HubRouteHandler = lazy(() => import('./views/HubRouteHandler'));
// AIDEV-NOTE: Páginas protegidas também em lazy loading
const CollectionPage = lazy(() => import('./pages/CollectionPage'));
const WorksPage = lazy(() => import('./pages/WorksPage'));
const UploadPage = lazy(() => import('./pages/UploadPage'));
// Lazy load das novas páginas modernas
const PageView = lazy(() => import('./pages/PageView'));
const ReaderChapter = lazy(() => import('./pages/ReaderChapter'));

// AIDEV-NOTE: Redirect components moved to RouteRedirects.jsx for better organization

// Pré-carregamento das páginas principais para evitar flicking
import('./pages/CollectionPage');
import('./pages/WorksPage');
import('./pages/UploadPage');

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

    // AIDEV-NOTE: Only initial loading state, removed route-based loading to prevent flickering
    const [initialLoading, setInitialLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        // AIDEV-NOTE: Initial app setup with proper DOM ready check
        const initApp = () => {
            setInitialLoading(false);
            // AIDEV-NOTE: Create particles only after DOM is fully ready
            setTimeout(() => {
                createParticles();
            }, 200);
        };
        
        if (document.readyState === 'complete') {
            initApp();
        } else {
            window.addEventListener('load', initApp);
            return () => window.removeEventListener('load', initApp);
        }
        
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

    // AIDEV-NOTE: Tela de carregamento apenas para inicialização da aplicação
    if (initialLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <Spinner size="lg" text="Carregando..." />
            </div>
        );
    }

    return (
        <UserPreferencesProvider>
            <HubProvider>
                <div className="app-root-container">
                    <GlobalRemoteStorageWidget />
                    <div id="particles-container" />

                    <Routes>
                        <Route path="/" element={<MainLayout />}>
                            <Route index element={
                                <Suspense fallback={<div className="min-h-screen bg-transparent" />}> 
                                    <MainContent />
                                </Suspense>
                            } />
                            <Route path="collection" element={
                                <Suspense fallback={<div className="min-h-screen bg-transparent" />}> 
                                    <CollectionPage />
                                </Suspense>
                            } />
                            <Route path="works" element={
                                <Suspense fallback={<div className="min-h-screen bg-transparent" />}> 
                                    <WorksPage />
                                </Suspense>
                            } />
                            <Route path="upload" element={
                                <Suspense fallback={<div className="min-h-screen bg-transparent" />}> 
                                    <UploadPage />
                                </Suspense>
                            } />
                            <Route path="hub/:encodedUrl" element={
                                <Suspense fallback={<div className="min-h-screen bg-transparent" />}> 
                                    <HubRouteHandler />
                                </Suspense>
                            } />
                        </Route>
                        {/* Novas rotas modernas */}
                        <Route path="/manga/:encodedUrl" element={
                            <Suspense fallback={<div className="min-h-screen bg-transparent" />}>
                                <PageView />
                            </Suspense>
                        } />
                        <Route path="/reader/:encodedUrl/:encodedChapterId" element={
                            <Suspense fallback={<div className="min-h-screen bg-transparent" />}>
                                <ReaderChapter />
                            </Suspense>
                        } />
                        {/* AIDEV-NOTE: Simplified redirect routes using centralized components */}
                        <Route path="/reader/:encodedUrl" element={<ReaderToMangaRedirect />} />
                        <Route path="/leitor/:encodedUrl" element={<ReaderToMangaRedirect />} />
                        <Route path="/leitor/:encodedUrl/:encodedChapterId" element={<LeitorToReaderRedirect />} />
                    </Routes>
                </div>
            </HubProvider>
        </UserPreferencesProvider>
    );
}

export default App;
