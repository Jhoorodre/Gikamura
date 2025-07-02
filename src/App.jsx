import { useRef, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import { useRemoteStorageContext } from './context/RemoteStorageContext';
import { useServiceWorker } from './hooks/useServiceWorker';
import { useNetworkNotifications } from './hooks/useNetworkMonitor';
import { useHubLoader } from './hooks/useHubLoader';
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
import SeriesDetailPage from './pages/SeriesDetailPage';
import ArrowNavigation from './components/common/ArrowNavigation';
import GlobalRemoteStorageWidget from './components/common/SimpleRemoteStorageWidgetNew';
import RemoteStorageDebug from './components/common/RemoteStorageDebug';
import { runFullDiagnostic } from './utils/networkDebug';

function App() {
    const { conflictMessage: appConflictMessage } = useAppContext();
    const { isConnected: remoteStorageConnected, isSyncing, conflictMessage } = useRemoteStorageContext();
    const { isOnline, updateAvailable, applyUpdate } = useServiceWorker();
    const { networkMessage, dismissSlowMessage } = useNetworkNotifications();
    
    // Hook centralizado para carregamento de hubs (SEM URL padrão para evitar carregamento automático)
    const { url: hubUrl, setUrl: setHubUrl, loading, handleSubmit: handleLoadHub } = useHubLoader();

    useEffect(() => {
        createParticles();
        console.log('🚀 [App] Aplicação iniciada - Remote Storage conectado:', remoteStorageConnected);
    }, []); // FIXO: Removendo dependência que pode causar loop

    // Diagnóstico uma única vez na inicialização
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
    }, []); // Executa apenas uma vez

    return (
        <div className="min-h-screen flex flex-col">
            {/* Componentes globais sempre presentes */}
            <ArrowNavigation />
            <GlobalRemoteStorageWidget />
            {process.env.NODE_ENV === 'development' && <RemoteStorageDebug />}
            
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
            {appConflictMessage && (
                <div className="conflict-indicator">
                    <ErrorMessage message={appConflictMessage} />
                </div>
            )}

            {/* Sistema de Rotas Unificado */}
            <Routes>
                {/* Rota principal condicional */}
                <Route path="/" element={
                    !remoteStorageConnected ? (
                        /* Modo 1: Sem Remote Storage - Sempre usa MainContent */
                        <main className="flex-grow flex flex-col">
                            <div className="container mx-auto px-4 py-8 w-full">
                                <MainContent />
                            </div>
                        </main>
                    ) : (
                        /* Modo 2: Com Remote Storage */
                        <main className="flex-grow flex flex-col">
                            <div className="container mx-auto px-4 py-8 w-full">
                                <MainContent />
                            </div>
                        </main>
                    )
                } />
                
                {/* Rotas sempre disponíveis com condicionais internas */}
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

                {/* Rotas globais sempre disponíveis */}
                <Route path="/hub/:encodedUrl" element={<HubRouteHandler />} />
                <Route path="/series/:encodedUrl" element={<SeriesDetailPage />} />
                <Route path="/series/:encodedId" element={<ItemDetailView />} />
                <Route path="/read/:encodedSeriesId/:encodedEntryKey" element={<ReaderView />} />
                <Route path="/redirect/:base64Url" element={<RedirectPage />} />
            </Routes>
        </div>
    );
}

export default App;
