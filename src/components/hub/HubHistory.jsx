import React from 'react';
import { HistoryIcon, TrashIcon } from '../common/Icones';
import Image from '../common/Image';

const HubHistory = ({ hubs, onSelectHub, onRemoveHub }) => {
    if (!hubs || hubs.length === 0) return null;

    return (
        <div className="panel-solid rounded-2xl p-6 mb-6 fade-in">
            <div className="flex items-center gap-3 mb-4">
                <HistoryIcon />
                <h3 className="text-xl font-bold text-white orbitron">Hubs Salvos</h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {hubs.map((hub) => (
                    <div key={hub.url} className="chapter-item flex items-center justify-between p-3 rounded-lg panel-dark cursor-pointer">
                        <div className="flex items-center gap-3 flex-1" onClick={() => onSelectHub(hub)}>
                            {hub.iconUrl && (
                                <Image 
                                    src={hub.iconUrl} 
                                    alt={hub.title} 
                                    className="w-8 h-8 rounded-full object-cover bg-gray-800" 
                                />
                            )}
                            <div className="flex-1">
                                <p className="text-white font-medium truncate">{hub.title}</p>
                                <p className="text-gray-400 text-sm truncate">{hub.url}</p>
                            </div>
                        </div>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemoveHub(hub.url);
                            }}
                            className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remover hub"
                        >
                            <TrashIcon />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HubHistory;
