import { useAppContext } from '../../context/AppContext';
import { useRemoteStorageContext } from '../../context/RemoteStorageContext';
import { useHubLoader } from '../../hooks/useHubLoader';
import '../../styles/hub-loader.css';
import HubHistory from './HubHistory';
import { BookOpenIcon } from '../common/Icones';
import { Link } from 'react-router-dom';

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
                        {/* Título */}
                        <div className="text-center">
                            <h1 className="text-5xl orbitron text-accent mb-6">Gikamoe</h1>
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
        <div className="hub-connected-container">
            {/* Status de Conexão */}
            <div className="connection-status connected">
                <div className="status-dot"></div>
                <span>Remote Storage Conectado</span>
            </div>

            {/* Layout Central com Cards ao Redor */}
            <div className="hub-central-layout">
                {/* Card Coleção - Top Left */}
                <Link to="/collection" className="nav-card nav-card-collection hub-card-top-left">
                    <div className="nav-card-icon">
                        <BookOpenIcon />
                    </div>
                    <div className="nav-card-content">
                        <h3>Coleção</h3>
                        <p>Veja seus itens favoritados e histórico sincronizados.</p>
                    </div>
                </Link>

                {/* Card Obras - Top Right */}
                <Link to="/works" className="nav-card nav-card-works hub-card-top-right">
                    <div className="nav-card-icon">
                        <span className="text-2xl">⭐</span>
                    </div>
                    <div className="nav-card-content">
                        <h3>Obras</h3>
                        <p>Acesse suas obras pinadas e favoritas.</p>
                    </div>
                </Link>

                {/* Hub Central */}
                <div className="hub-central-card">
                    <div className="hub-loader-header">
                        <h1 className="orbitron text-accent">HUB</h1>
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

                {/* Card Upload - Bottom Left */}
                <Link to="/upload" className="nav-card nav-card-upload hub-card-bottom-left">
                    <div className="nav-card-icon">
                        <span className="text-2xl">📤</span>
                    </div>
                    <div className="nav-card-content">
                        <h3>Upload</h3>
                        <p>Faça upload de novos hubs ou conteúdos.</p>
                    </div>
                </Link>

                {/* Card Em breve - Bottom Right */}
                <div className="nav-card nav-card-placeholder hub-card-bottom-right">
                    <div className="nav-card-icon">
                        <span className="text-2xl opacity-50">🔧</span>
                    </div>
                    <div className="nav-card-content">
                        <h3 className="opacity-50">Em breve</h3>
                        <p className="opacity-50">Novas funcionalidades chegando...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// A linha mais importante: exportamos o componente como padrão
export default HubLoaderComponent;