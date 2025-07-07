// AIDEV-NOTE: Página Hub Loader minimalista, foco em UX limpa e onboarding rápido
import { useAppContext } from '../../context/AppContext';
import { useRemoteStorageContext } from '../../context/RemoteStorageContext';
import { useHubLoader } from '../../hooks/useHubLoader';
import { useLocation } from 'react-router-dom';
import HubHistory from './HubHistory';
// AIDEV-NOTE: css-unified; usando sistema CSS unificado via index.css

const HubLoaderComponent = () => {
    const { savedHubs, removeHub } = useAppContext();
    const { isConnected } = useRemoteStorageContext() || { isConnected: false };
    const location = useLocation();
    
    const { 
        url, 
        setUrl, 
        loading, 
        error, 
        handleSubmit, 
        loadHub, 
        resetError 
    } = useHubLoader();

    // AIDEV-NOTE: Debug log to track what's being displayed
    if (import.meta.env?.DEV && savedHubs?.length > 0) {
        console.log('🔍 [HubLoaderComponent] savedHubs:', savedHubs);
    }

    // AIDEV-NOTE: On main route, don't show hub history to keep the UI clean
    const shouldShowHistory = location.pathname !== '/' && isConnected && savedHubs && savedHubs.length > 0;

    // AIDEV-NOTE: Permite carregar hub diretamente do histórico
    const handleLoadDirectly = (hubUrl) => {
        loadHub(hubUrl);
    };

    return (
        <div className="min-page-container">
            <div className="min-content-wrapper">
                <div className="min-header">
                    <h1 className="min-title">Gikamura</h1>
                    <p className="min-subtitle">
                        <em>Malo periculosam libertatem quam quietum servitium.</em>
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="min-form">
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => {
                            setUrl(e.target.value);
                            resetError();
                        }}
                        placeholder="Git Raw"
                        className="min-input"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !url.trim()}
                        className="min-button"
                    >
                        {loading ? 'Carregando...' : 'Go'}
                    </button>
                    {error && (
                        <p className="min-error-message">{error}</p>
                    )}
                </form>
                {/* AIDEV-NOTE: Hub history completely disabled on main route to keep UI clean */}
                {false && shouldShowHistory && (
                    <div className="min-history-section">
                        <h2 className="min-section-title">Hubs Recentes</h2>
                        <HubHistory
                            hubs={savedHubs.filter(hub => 
                                hub && 
                                typeof hub === 'object' && 
                                hub.url && 
                                hub.title && 
                                typeof hub.url === 'string' && 
                                typeof hub.title === 'string' &&
                                !hub.url.includes('localhost:') && // AIDEV-NOTE: Filter out corrupted localhost entries
                                !hub.url.includes('127.0.0.1:')
                            )}
                            onSelectHub={(hub) => handleLoadDirectly(hub.url)}
                            onRemoveHub={removeHub}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default HubLoaderComponent;