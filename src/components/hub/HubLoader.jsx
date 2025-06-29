import React, { useState } from 'react';
import '../../styles/hub-loader.css';

const HubLoader = ({ onLoadHub, loading }) => {
    const [url, setUrl] = useState("https://raw.githubusercontent.com/Jhoorodre/TOG-Brasil/main/hub_tog.json");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (url.trim()) onLoadHub(url.trim());
    };

    return (
        <div className="hub-loader-container">
            <div className="hub-loader-content">
                <div className="hub-loader-header">
                    <h1 className="hub-loader-title">Leitor de Mangá</h1>
                    <p className="hub-loader-subtitle">
                        Cole a URL de um `hub.json` para começar a ler.
                    </p>
                </div>
                <form className="hub-loader-form" onSubmit={handleSubmit}>
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
            </div>
        </div>
    );
};

export default HubLoader;
