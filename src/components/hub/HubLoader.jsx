import React, { useState } from 'react';
import '../../styles/hub-loader.css';
import { CloudIcon } from '../common/Icones'; // Importar o ícone de nuvem

// Recebe as props isConnected e a função onConnectClick do componente pai (App.jsx)
const HubLoader = ({ onLoadHub, loading, isConnected, onConnectClick }) => {
    const [url, setUrl] = useState("https://raw.githubusercontent.com/Jhoorodre/TOG-Brasil/main/hub_tog.json");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (url.trim()) onLoadHub(url.trim());
    };

    return (
        <div className="hub-loader-container">
            {/* Botão do ícone de nuvem no canto inferior esquerdo */}
            <button
                type="button"
                onClick={onConnectClick} // Chama a função para abrir/fechar o widget nativo
                className="cloud-icon-button" // Classe para estilização
                title={isConnected ? 'Ver Conta Remote Storage' : 'Conectar Remote Storage'}
            >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            </button>

            <div className="hub-loader-content">
                {/* Header minimalista */}
                <div className="hub-loader-header">
                    <h1 className="hub-loader-title">Hub Loader</h1>
                    <p className="hub-loader-subtitle">
                        Carregue seu hub de conteúdo ou conecte-se à nuvem.
                    </p>
                </div>

                {/* Formulário principal de carregamento de Hub */}
                <form className="hub-loader-form" onSubmit={handleSubmit}>
                    <label htmlFor="hub-url" className="block text-sm font-medium text-gray-400 mb-2">Cole a URL de um `hub.json` para começar a ler:</label>
                    <div className="hub-loader-input-group">
                        <input 
                            id="hub-url"
                            type="url" 
                            value={url} 
                            onChange={(e) => setUrl(e.target.value)} 
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
                            {loading ? (
                                <div className="hub-loader-spinner" />
                            ) : (
                                'Carregar'
                            )}
                        </button>
                    </div>
                </form>

                {/* Contêiner onde o widget nativo do Remote Storage será renderizado */}
                <div id="remotestorage-widget-container"></div>

            </div>
        </div>
    );
};

export default HubLoader;