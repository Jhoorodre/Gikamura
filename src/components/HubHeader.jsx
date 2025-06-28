import React from 'react';
import { CloudIcon } from './Icones';

const SocialLinks = ({ social }) => (
    <div className="mt-6">
        <h4 className="font-bold text-lg text-red-300 mb-3 text-left">Junte-se à nossa comunidade:</h4>
        <div className="flex flex-wrap gap-4">
            {social.platforms.map((platform) => (
                <a key={platform.id} href={platform.url} target="_blank" rel="noopener noreferrer" className="panel-dark px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors flex-grow text-center">{platform.name}</a>
            ))}
        </div>
    </div>
);

const HubHeader = ({ hub, social, onSaveHub, isHubSaved }) => (
    <div className="panel-solid rounded-3xl p-8 mb-16 fade-in">
        <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="relative flex-shrink-0">
                <div className="neon-border rounded-full">
                    <img src={`https://corsproxy.io/?${encodeURIComponent(hub.icon.url)}`} alt={hub.icon.alt} className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover shadow-2xl bg-gray-800" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
            </div>
            <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center gap-4 mb-4 justify-center lg:justify-start">
                    <h1 className="text-4xl md:text-5xl font-black header-title orbitron">{hub.title}</h1>
                    <button
                        onClick={onSaveHub}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                            isHubSaved 
                                ? 'bg-green-800/50 text-green-300 hover:bg-green-700/50' 
                                : 'panel-dark text-white hover:bg-white/10'
                        }`}
                        title={isHubSaved ? 'Hub salvo' : 'Salvar hub'}
                    >
                        <CloudIcon />
                    </button>
                </div>
                <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-p:leading-relaxed">
                    <p className="whitespace-pre-wrap">{hub.description}</p>
                    {social && <SocialLinks social={social} />}
                </div>
            </div>
        </div>
    </div>
);

export default HubHeader;
