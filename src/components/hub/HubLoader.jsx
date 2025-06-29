import React, { useState, useEffect } from 'react';
import '../../styles/hub-loader.css';

const HubLoader = ({ onLoadHub, loading }) => {
    const [url, setUrl] = useState("https://raw.githubusercontent.com/Jhoorodre/TOG-Brasil/main/hub_tog.json");
    const [isConnected, setIsConnected] = useState(false);

    // Inicializar RemoteStorage quando o componente montar
    useEffect(() => {
        if (typeof window !== 'undefined' && window.remoteStorage) {
            // Verificar status de conexão
            const checkConnection = () => {
                setIsConnected(window.remoteStorage.connected);
            };

            window.remoteStorage.on('connected', checkConnection);
            window.remoteStorage.on('disconnected', checkConnection);
            
            // Verificação inicial
            checkConnection();

            return () => {
                window.remoteStorage.removeEventListener('connected', checkConnection);
                window.remoteStorage.removeEventListener('disconnected', checkConnection);
            };
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (url.trim()) {
            onLoadHub(url.trim());
        }
    };

    const handleRemoteStorageConnect = () => {
        if (window.remoteStorage) {
            window.remoteStorage.connect();
        }
    };

    return (
        <div className="hub-loader-container">
            <div className="hub-loader-content">
                {/* Header minimalista */}
                <div className="hub-loader-header">
                    <h1 className="hub-loader-title">Hub Loader</h1>
                    <p className="hub-loader-subtitle">
                        Carregue seu hub de conteúdo
                    </p>
                </div>

                {/* Formulário principal */}
                <div className="hub-loader-form" onSubmit={handleSubmit}>
                    <div className="hub-loader-input-group">
                        <input 
                            type="url" 
                            value={url} 
                            onChange={(e) => setUrl(e.target.value)} 
                            className="hub-loader-input"
                            placeholder="https://exemplo.com/hub.json" 
                            required 
                            disabled={loading}
                        />
                        <button 
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading || !url.trim()} 
                            className="hub-loader-button"
                        >
                            {loading ? (
                                <div className="hub-loader-spinner" />
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                    <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                                </svg>
                            )}
                            Carregar
                        </button>
                    </div>
                </div>

                {/* Status do RemoteStorage */}
                <div className="hub-loader-status">
                    <div className="storage-status">
                        <div className={`storage-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
                        <span className="storage-text">
                            {isConnected ? 'Armazenamento conectado' : 'Armazenamento desconectado'}
                        </span>
                        {!isConnected && (
                            <button 
                                type="button"
                                onClick={handleRemoteStorageConnect}
                                className="storage-connect-btn"
                            >
                                Conectar
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer minimalista */}
                <div className="hub-loader-footer">
                    <p className="hub-loader-hint">
                        Conecte seu armazenamento para salvar preferências
                    </p>
                </div>
            </div>

            {/* Botão RemoteStorage flutuante */}
            <div id="remotestorage-connect" className="rs-floating-button">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                </svg>
            </div>
        </div>
    );
};

export default HubLoader;