import React from 'react';
import { ChevronLeftIcon } from '../common/Icones';
import Image from '../common/Image';

const MangaInfo = ({ mangaData, onBackToHub }) => (
    <div className="panel-solid rounded-3xl p-8 mb-8 fade-in">
        <button onClick={onBackToHub} className="mb-8 panel-dark px-6 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-300 flex items-center gap-3"><ChevronLeftIcon /> <span className="font-medium">Voltar à Lista</span></button>
        <div className="flex flex-col lg:flex-row items-start gap-8">
            <div className="relative flex-shrink-0">
                <div className="neon-border rounded-2xl">
                    <Image 
                        src={mangaData.cover.url} 
                        alt={mangaData.cover.alt} 
                        className="w-64 h-auto object-cover rounded-2xl shadow-2xl bg-gray-800" 
                        errorSrc='https://placehold.co/256x358/1f2937/4b5563?text=Capa'
                    />
                </div>
            </div>
            <div className="flex-1 text-white">
                <h1 className="text-5xl font-bold mb-4 header-title orbitron">{mangaData.title}</h1>
                <p className="text-2xl text-red-300 mb-2 font-medium">por {mangaData.author.name}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                    <span className="panel-dark px-3 py-1 rounded-md text-sm font-semibold capitalize">{mangaData.status.translation}</span>
                    <span className="panel-dark px-3 py-1 rounded-md text-sm font-semibold capitalize">{mangaData.type}</span>
                    <span className="panel-dark px-3 py-1 rounded-md text-sm font-semibold">{mangaData.publication.year}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                    {mangaData.genres.map(g => <span key={g} className="bg-red-900/50 text-red-300 px-3 py-1 rounded-full text-xs font-medium capitalize">{g}</span>)}
                </div>
                <div className="prose prose-invert prose-lg max-w-none"><p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{mangaData.description}</p></div>
            </div>
        </div>
    </div>
);

export default MangaInfo;
