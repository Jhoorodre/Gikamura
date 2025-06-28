import React, { useState } from 'react';

const HubLoader = ({ onLoadHub, loading }) => {
    const [url, setUrl] = useState("https://raw.githubusercontent.com/Jhoorodre/TOG-Brasil/main/hub_tog.json");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (url.trim()) {
            onLoadHub(url.trim());
        }
    };

    return (
        <div className="card text-center w-full" style={{ maxWidth: '600px' }}>
            <h1 className="orbitron mb-6">
                Carregar Hub
            </h1>
            <p className="mb-8">
                Insira o URL Json que deseja carregar.
            </p>
            <form onSubmit={handleSubmit} className="flex gap-4">
                <div className="form-group w-full">
                    <input 
                        type="url" 
                        value={url} 
                        onChange={(e) => setUrl(e.target.value)} 
                        className="form-input"
                        placeholder="https://exemplo.com/seu_hub.json" 
                        required 
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="btn btn-primary"
                >
                    {loading ? 'A carregar...' : 'Carregar'}
                </button>
            </form>
        </div>
    );
};

export default HubLoader;
