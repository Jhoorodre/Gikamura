// AIDEV-NOTE: Página Hub Loader minimalista, foco em UX limpa e onboarding rápido
import { useAppContext } from '../../context/AppContext';
import { useRemoteStorageContext } from '../../context/RemoteStorageContext';
import { useHubLoader } from '../../hooks/useHubLoader';
import HubHistory from './HubHistory';
import '../../styles/minimalist-pages.css';

const HubLoaderComponent = () => {
    const { savedHubs, removeHub } = useAppContext();
    const { isConnected } = useRemoteStorageContext() || { isConnected: false };
    
    const { 
        url, 
        setUrl, 
        loading, 
        error, 
        handleSubmit, 
        loadHub, 
        resetError 
    } = useHubLoader();

    // AIDEV-NOTE: Permite carregar hub diretamente do histórico
    const handleLoadDirectly = (hubUrl) => {
        loadHub(hubUrl);
    };

    return (
        <div className="min-page-container">
            <div className="min-content-wrapper">
                <div className="min-header">
                    <h1 className="min-title">Gikamoe</h1>
                    <p className="min-subtitle">
                        {isConnected ? 'Bem-vindo(a) de volta.' : 'Insira o URL de um hub.json para começar.'}
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
                        placeholder="https://exemplo.com/hub.json"
                        className="min-input"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !url.trim()}
                        className="min-button"
                    >
                        {loading ? 'Carregando...' : 'Carregar Hub'}
                    </button>
                    {error && (
                        <p className="min-error-message">{error}</p>
                    )}
                </form>
                {/* AIDEV-NOTE: Histórico de hubs só aparece se conectado */}
                {isConnected && savedHubs && savedHubs.length > 0 && (
                    <div className="min-history-section">
                        <h2 className="min-section-title">Hubs Recentes</h2>
                        <HubHistory
                            hubs={savedHubs}
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