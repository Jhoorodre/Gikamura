import { useAppContext } from '../../context/AppContext';
import { useRemoteStorageContext } from '../../context/RemoteStorageContext';
import { useHubLoader } from '../../hooks/useHubLoader';
import '../../styles/hub-loader.css';
import HubHistory from './HubHistory';

const HubLoaderComponent = () => {
    const { savedHubs, removeHub } = useAppContext();
    const { isConnected } = useRemoteStorageContext() || { isConnected: false };
    
    // Debug log para verificar o estado de conexão
    if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [HubLoaderComponent] Estado de conexão:', { isConnected });
    }
    
    // Hook centralizado para carregamento de hubs
    const { 
        url, 
        setUrl, 
        loading, 
        error, 
        handleSubmit, 
        loadHub, 
        resetError 
    } = useHubLoader(); // Removido URL padrão para evitar loop infinito

    const handleLoadDirectly = (hubUrl) => {
        loadHub(hubUrl);
    };

    // Versão anônima quando não conectado - APENAS JSON placeholder
    if (!isConnected) {
        return (
            <div className="anonymous-page min-h-screen flex items-center justify-center">
                <div className="container mx-auto px-4 py-8">
                    <div className="fade-in-minimal space-y-8 w-full max-w-lg mx-auto">
                        {/* AIDEV-NOTE: Title removed when not connected per user request */}
                        <div className="text-center">
                            <p className="text-text-secondary text-lg mb-6">
                                Conecte-se ao Remote Storage ou cole um link JSON
                            </p>
                        </div>

                        {/* Hub Loader Simples */}
                        <div className="w-full">
                            <div className="text-center mb-6">
                                <p className="text-text-secondary text-base">
                                    Cole o link direto do arquivo JSON
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <input
                                        type="text"
                                        value={url}
                                        onChange={(e) => {
                                            setUrl(e.target.value);
                                            resetError();
                                        }}
                                        placeholder="https://raw.githubusercontent.com/.../hub.json"
                                        className="w-full p-4 bg-surface-secondary rounded-lg border border-surface-tertiary focus:border-accent transition-all duration-300 text-text-primary placeholder-text-tertiary text-base focus:ring-2 focus:ring-accent/20"
                                        disabled={loading}
                                    />
                                </div>
                                
                                {error && (
                                    <div className="text-red-400 text-sm text-center bg-red-900/20 p-4 rounded-lg border border-red-800/30">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !url.trim()}
                                    className="w-full p-4 bg-accent text-black rounded-lg font-semibold text-base hover:bg-accent/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                                >
                                    {loading ? 'Carregando...' : 'Acessar Hub'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Versão completa quando conectado - Layout central sem widget duplicado
    // VERIFICAÇÃO EXTRA: Só mostra cards se realmente conectado
    if (!isConnected) {
        console.warn('🚨 [HubLoaderComponent] Tentativa de mostrar versão conectada sem estar conectado!');
        return null; // Fail-safe
    }
    
    return (
        <div className="hub-dashboard-container">
            {/* AIDEV-NOTE: Transformed into focused Hub Dashboard without navigation cards */}
            <div className="hub-dashboard-layout">
                {/* AIDEV-NOTE: Main hub loading interface - simplified and focused */}
                <div className="hub-main-card">
                    <div className="hub-loader-header">
                        <h1 className="orbitron text-accent">HUB LOADER</h1>
                        <p className="text-text-secondary">
                            Cole a URL de um hub.json para carregar a aplicação
                        </p>
                    </div>

                    <form className="hub-loader-form" onSubmit={handleSubmit}>
                        <input
                            id="hub-url"
                            type="url"
                            value={url}
                            onChange={(e) => {
                                setUrl(e.target.value);
                                resetError();
                            }}
                            placeholder="https://exemplo.com/hub.json"
                            required
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !url.trim()}
                        >
                            {loading ? 'Carregando...' : 'Carregar Hub'}
                        </button>
                        
                        {error && (
                            <p className="text-error text-sm text-center bg-error/10 p-3 rounded-lg border border-error/20 mt-4">
                                {error}
                            </p>
                        )}
                    </form>

                    {/* Histórico de Hubs - Compacto */}
                    <div className="hub-history-compact">
                        <HubHistory
                            hubs={savedHubs}
                            onSelectHub={(hub) => handleLoadDirectly(hub.url)}
                            onRemoveHub={removeHub}
                        />
                    </div>
                </div>

                {/* AIDEV-NOTE: Welcome message and usage tips */}
                <div className="hub-info-card">
                    <div className="hub-info-content">
                        <h3>🎯 Como usar</h3>
                        <ul className="hub-tips-list">
                            <li>Cole a URL de um arquivo hub.json acima</li>
                            <li>Use a navegação superior para acessar outras seções</li>
                            <li>Seus dados ficam sincronizados via RemoteStorage</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

// A linha mais importante: exportamos o componente como padrão
export default HubLoaderComponent;