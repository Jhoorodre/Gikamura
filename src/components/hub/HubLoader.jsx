import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
// AIDEV-NOTE: css-legacy; removido import direto, usando sistema unificado
import HubHistory from './HubHistory';
import { encodeUrl } from '../../utils/encoding';
import { APP_CONFIG } from '../../constants/app';

const HubLoader = ({ onLoadHub, loading }) => {
    const [url, setUrl] = useState(APP_CONFIG.DEFAULT_HUB_URL); // AIDEV-NOTE: Use normalized URL from constants
    const [error, setError] = useState('');
    const { savedHubs, removeHub } = useAppContext();

    /**
     * Constrói uma URL para a própria aplicação com a URL do hub
     * codificada em base64 e a abre numa nova guia.
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        setError(''); // Limpa erros anteriores ao submeter
        const targetUrl = url.trim();

        if (targetUrl) {
            try {
                const encodedHubUrl = encodeUrl(targetUrl);
                // Exemplo: http://localhost:5173/#/?hub=BASE64_STRING
                const newAppUrl = `${window.location.origin}/#/?hub=${encodedHubUrl}`;
                window.open(newAppUrl, '_blank', 'noopener,noreferrer');
            } catch (error) {
                console.error("Falha ao codificar a URL do hub:", error);
                setError("URL inválida ou erro ao processar. Verifique o formato da URL e tente novamente.");
            }
        }
    };

    return (
        <div className="hub-loader-container">
            <div className="hub-loader-content">
                <div className="hub-loader-header">
                    <h1 className="hub-loader-title">Leitor de Mangá</h1>
                    <p className="hub-loader-subtitle">
                        Cole a URL de um `hub.json` para carregar a aplicação numa nova guia.
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
                            placeholder="Git Raw"
                            required
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !url.trim()}
                            className="hub-loader-button"
                        >
                            {loading ? (
                                <div className="hub-loader-spinner" />
                            ) : (
                                'Go'
                            )}
                        </button>
                    </div>
                    {/* Exibe a mensagem de erro logo abaixo do input */}
                    {error && (
                        <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
                    )}
                </form>

                <HubHistory 
                    hubs={savedHubs}
                    onSelectHub={(hub) => onLoadHub(hub.url)} // O histórico continua carregando na mesma aba
                    onRemoveHub={removeHub}
                />
            </div>
        </div>
    );
};

export default HubLoader;
