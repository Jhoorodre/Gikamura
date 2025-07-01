import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import '../../styles/hub-loader.css';
import HubHistory from './HubHistory';
import { BookOpenIcon } from '../common/Icones';
import { encodeUrl } from '../../utils/encoding';

// Definimos o componente como uma constante
const HubLoaderComponent = ({ onLoadHub, loading }) => {
    const [url, setUrl] = useState("https://raw.githubusercontent.com/Jhoorodre/TOG-Brasil/refs/heads/main/hub_tog.json");
    const [error, setError] = useState('');
    const { savedHubs, removeHub, isConnected } = useAppContext();
    const navigate = useNavigate();

    /**
     * Constrói uma URL para a nova rota com a URL do hub
     * codificada em base64 e a abre numa nova guia.
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        setError(''); // Limpa erros anteriores ao submeter
        const targetUrl = url.trim();

        if (targetUrl) {
            try {
                const encodedHubUrl = encodeUrl(targetUrl);
                navigate(`/hub/${encodedHubUrl}`);
            } catch (error) {
                console.error("Falha ao codificar a URL do hub:", error);
                setError("URL inválida ou erro ao processar. Verifique o formato da URL e tente novamente.");
            }
        }
    };

    /**
     * Função para carregar um hub diretamente na aplicação (usado pelo histórico).
     */
    const handleLoadDirectly = (hubUrl) => {
        onLoadHub(hubUrl);
    };

    return (
        <div className="hub-loader-container">
            <div className="hub-loader-main">
                {/* Painel Principal */}
                <div className="hub-loader-content">
                    <div className="hub-loader-header">
                        <h1 className="hub-loader-title">Leitor de Mangá</h1>
                        <p className="hub-loader-subtitle">
                            Cole a URL de um hub.json para carregar a aplicação numa nova guia e explorar sua biblioteca de mangás.
                        </p>
                    </div>

                    <form className="hub-loader-form" onSubmit={handleSubmit}>
                        <div className="hub-loader-input-group">
                            <input
                                id="hub-url"
                                type="url"
                                value={url}
                                onChange={(e) => {
                                    setUrl(e.target.value);
                                    // Limpa a mensagem de erro assim que o usuário começa a corrigir
                                    if (error) setError('');
                                }}
                                className="hub-loader-input"
                                placeholder="https://exemplo.com/hub.json"
                                required
                                disabled={loading}
                                aria-label="URL do hub JSON"
                            />
                            <button
                                type="submit"
                                disabled={loading || !url.trim()}
                                className="hub-loader-button"
                                aria-label={loading ? "Carregando..." : "Carregar hub"}
                            >
                                {loading ? 'Carregando...' : 'Carregar Hub'}
                            </button>
                        </div>
                        
                        {/* Exibe a mensagem de erro */}
                        {error && (
                            <p className="text-red-400 text-sm mt-4 text-center bg-red-900/20 p-3 rounded-lg border border-red-800/30">{error}</p>
                        )}
                    </form>

                    {/* Histórico de Hubs */}
                    <HubHistory
                        hubs={savedHubs}
                        onSelectHub={(hub) => handleLoadDirectly(hub.url)}
                        onRemoveHub={removeHub}
                    />
                </div>

                {/* Sidebar */}
                <div className="hub-loader-sidebar">
                    {/* Card da Biblioteca - Sempre visível */}
                    <Link to="/library" className="library-card">
                        <div className="library-card-content">
                            <div className="library-card-icon">
                                <BookOpenIcon />
                            </div>
                            <div className="library-card-text">
                                <h3>Acessar Biblioteca</h3>
                                <p>
                                    {isConnected 
                                        ? "Veja suas séries fixadas e histórico de leitura sincronizados."
                                        : "Explore funcionalidades básicas da biblioteca. Conecte-se para sync completo."
                                    }
                                </p>
                            </div>
                        </div>
                    </Link>

                    {/* Status de Conexão */}
                    <div className="hub-history-section">
                        <div className="hub-history-header">
                            <h3 className="hub-history-title">Status RemoteStorage</h3>
                        </div>
                        <div className="text-center">
                            {isConnected ? (
                                <div className="text-green-400 text-sm flex items-center justify-center gap-2">
                                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                    Conectado e sincronizado
                                </div>
                            ) : (
                                <div className="text-yellow-400 text-sm flex items-center justify-center gap-2">
                                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                    Desconectado - Funcionalidade limitada
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// A linha mais importante: exportamos o componente como padrão
export default HubLoaderComponent;