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
        <div className="panel-solid rounded-3xl p-8 w-full max-w-2xl text-center fade-in">
            <h1 className="text-4xl font-black mb-6 header-title orbitron">Carregar Hub</h1>
            <p className="text-gray-300 mb-8">Insira o URL Json que deseja carregar.</p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                <input 
                    type="url" 
                    value={url} 
                    onChange={(e) => setUrl(e.target.value)} 
                    className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-white" 
                    placeholder="https://exemplo.com/seu_hub.json" 
                    required 
                />
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="bg-red-700 hover:bg-red-600 text-white px-8 py-3 rounded-xl transition-all duration-300 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'A carregar...' : 'Carregar'}
                </button>
            </form>
        </div>
    );
};

export default HubLoader;
