import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import '../../styles/hub-loader.css';
import HubHistory from './HubHistory';

// Definimos o componente como uma constante
const HubLoaderComponent = ({ onLoadHub, loading }) => {
    const [url, setUrl] = useState("https://raw.githubusercontent.com/Jhoorodre/TOG-Brasil/main/hub_tog.json");
    const [error, setError] = useState('');
    const { savedHubs, removeHub } = useAppContext();

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
                const encodedHubUrl = btoa(targetUrl);
                // Constrói a URL para a nova rota, ex: http://localhost:5173/hub/aHR0c...
                const newAppUrl = `${window.location.origin}/hub/${encodedHubUrl}`;
                window.open(newAppUrl, '_blank', 'noopener,noreferrer');
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
                            placeholder="https://exemplo.com/hub.json"
                            required
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !url.trim()}
                            className="hub-loader-button"
                        >
                            {loading ? <div className="hub-loader-spinner" /> : 'Carregar Hub'}
                        </button>
                    </div>
                    
                    {/* Exibe a mensagem de erro logo abaixo do input */}
                    {error && (
                        <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
                    )}
                </form>

                <HubHistory
                    hubs={savedHubs}
                    onSelectHub={(hub) => handleLoadDirectly(hub.url)}
                    onRemoveHub={removeHub}
                />
            </div>
        </div>
    );
};

// A linha mais importante: exportamos o componente como padrão
export default HubLoaderComponent;