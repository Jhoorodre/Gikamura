// Main App component - routing and global state
import { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import { useRemoteStorageContext } from './context/RemoteStorageContext';
import { useServiceWorker } from './hooks/useServiceWorker';

import { useHubLoader } from './hooks/useHubLoader';
import { createParticles } from './utils/particles.js';
import MainContent from './components/common/MainContent';
import RedirectPage from './pages/RedirectPage';
import ErrorMessage from './components/common/ErrorMessage';
import GlobalRemoteStorageWidget from './components/common/SimpleRemoteStorageWidgetNew';
import Header from './components/common/Header';

import Spinner from './components/common/Spinner';
import { HubProvider } from './context/HubContext';
import { UserPreferencesProvider } from './context/UserPreferencesContext';
import MainLayout from './components/common/MainLayout';
import { ReaderToMangaRedirect, LeitorToReaderRedirect } from './components/common/RouteRedirects';
import GuardedHubRoute from './components/common/GuardedHubRoute';
import GuardedMangaRoute from './components/common/GuardedMangaRoute';
import GuardedReaderRoute from './components/common/GuardedReaderRoute';
import { ROUTES } from './config/routes';
import { useRouteDebug } from './utils/routeDebugger';
import { useRoutePersistence } from './utils/routeStatePersister';
import { useRefreshHandler } from './hooks/useRefreshHandler';

// Lazy loading routes
const HubView = lazy(() => import('./views/HubView'));
const HubRouteHandler = lazy(() => import('./views/HubRouteHandler'));

const CollectionPage = lazy(() => import('./pages/CollectionPage'));
const WorksPage = lazy(() => import('./pages/WorksPage'));
const UploadPage = lazy(() => import('./pages/UploadPage'));

const PageView = lazy(() => import('./pages/PageView'));
const ReaderChapter = lazy(() => import('./pages/ReaderChapter'));



// Preload main pages
import('./pages/CollectionPage');
import('./pages/WorksPage');
import('./pages/UploadPage');

function App() {
    const { conflictMessage: appConflictMessage } = useAppContext();
    const { isConnected: remoteStorageConnected, conflictMessage } = useRemoteStorageContext();
    const { updateAvailable, applyUpdate } = useServiceWorker();

    const { url: _hubUrl, setUrl: _setHubUrl, loading: _loading, handleSubmit: _handleLoadHub } = useHubLoader();


    const [initialLoading, setInitialLoading] = useState(true);
    const location = useLocation();
    

    useRouteDebug();
    

    useRoutePersistence();
    

    useRefreshHandler();
    

    useEffect(() => {
        if (import.meta.env?.DEV) {
            console.log('🎯 [App] Rota atual:', {
                pathname: location.pathname,
                search: location.search,
                hash: location.hash,
                key: location.key
            });
        }
    }, [location]);

    useEffect(() => {

        const initApp = () => {

            document.body.classList.add('loaded');
            
            setInitialLoading(false);
            

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
        
        if (import.meta.env.DEV) {
            console.log('🚀 [App] Aplicação iniciada - Remote Storage conectado:', remoteStorageConnected);
        }
    }, []);




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
                        <Route path={ROUTES.HOME} element={<MainLayout />}>
                            <Route index element={
                                <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)', opacity: 0 }} />}> 
                                    <MainContent />
                                </Suspense>
                            } />
                            <Route path="collection" element={
                                <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)', opacity: 0 }} />}> 
                                    <CollectionPage />
                                </Suspense>
                            } />
                            <Route path="works" element={
                                <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)', opacity: 0 }} />}> 
                                    <WorksPage />
                                </Suspense>
                            } />
                            <Route path="upload" element={
                                <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)', opacity: 0 }} />}> 
                                    <UploadPage />
                                </Suspense>
                            } />
                            <Route path="hub/:encodedUrl" element={
                                <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)', opacity: 0 }} />}> 
                                    <GuardedHubRoute />
                                </Suspense>
                            } />
                        </Route>

                        <Route path={ROUTES.MANGA} element={
                            <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)', opacity: 0 }} />}>
                                <GuardedMangaRoute />
                            </Suspense>
                        } />
                        <Route path={ROUTES.READER} element={
                            <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)', opacity: 0 }} />}>
                                <GuardedReaderRoute />
                            </Suspense>
                        } />

                        <Route path={ROUTES.READER_OLD} element={<ReaderToMangaRedirect />} />
                        <Route path={ROUTES.LEITOR_OLD} element={<ReaderToMangaRedirect />} />
                        <Route path={ROUTES.LEITOR_CHAPTER_OLD} element={<LeitorToReaderRedirect />} />

                        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
                    </Routes>
                </div>
            </HubProvider>
        </UserPreferencesProvider>
    );
}

export default App;
