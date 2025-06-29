import React, { useState } from 'react';

import '../../styles/hub-loader.css';

const HubLoader = ({ onLoadHub, loading }) => {
    const [url, setUrl] = useState("https://raw.githubusercontent.com/Jhoorodre/TOG-Brasil/main/hub_tog.json");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (url.trim()) {
            onLoadHub(url.trim());
        }
    };

    return (
        <div className="hub-loader-container">
            <div className="hub-loader-content">
                <div className="hub-loader-header">
                    <h1 className="orbitron hub-loader-title">
                        Carregar Hub
                    </h1>
                    <p className="hub-loader-subtitle">
                        Insira o URL JSON do hub que deseja carregar
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="hub-loader-form">
                    <div className="hub-loader-input-group">
                        <input 
                            type="url" 
                            value={url} 
                            onChange={(e) => setUrl(e.target.value)} 
                            className="hub-loader-input"
                            placeholder="https://exemplo.com/seu_hub.json" 
                            required 
                        />
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="hub-loader-button"
                        >
                            {loading ? (
                                <div className="hub-loader-spinner"></div>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M8 2v4"></path>
                                    <path d="M16 2v4"></path>
                                    <path d="M21 14V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8"></path>
                                    <path d="M3 10h18"></path>
                                    <path d="m16 20 2 2 4-4"></path>
                                </svg>
                            )}
                            Carregar
                        </button>
                    </div>
                </form>

                <div className="hub-loader-footer">
                    <p className="hub-loader-hint">
                        Conecte seu armazenamento remoto para salvar preferências
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HubLoader;