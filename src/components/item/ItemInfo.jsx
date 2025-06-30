import React from 'react';
import Image from '../common/Image';

const ItemInfo = ({ itemData, pinned, onPinToggle }) => {
    if (!itemData) return null;
    const coverUrl = itemData.cover?.url;
    const coverAlt = itemData.cover?.alt || itemData.title;
    const authorName = itemData.author?.name || itemData.author || 'Desconhecido';
    const genres = itemData.genres || [];

    return (
        <div className="mb-8">
            <div className="card flex flex-col md:flex-row gap-8 relative">
                {coverUrl && (
                    <Image
                        src={coverUrl}
                        alt={coverAlt}
                        className="w-full md:w-64 h-auto object-cover rounded-xl flex-shrink-0"
                        errorSrc="https://placehold.co/256x384/1e293b/94a3b8?text=Capa"
                    />
                )}
                <div className="flex-grow">
                    {onPinToggle && (
                        <button
                            className={`absolute top-4 right-4 z-10 btn btn-sm btn-circle ${pinned ? 'btn-warning' : 'btn-ghost'}`}
                            title={pinned ? 'Desafixar dos favoritos' : 'Fixar nos favoritos'}
                            onClick={onPinToggle}
                        >
                            {pinned ? '★' : '☆'}
                        </button>
                    )}
                    <h1 className="orbitron text-3xl">{itemData.title}</h1>
                    <p className="text-lg mt-2 text-slate-300">
                        por {authorName}
                    </p>
                    {genres.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-6">
                            {genres.map(g => (
                                <span key={g} className="badge badge-primary">{g}</span>
                            ))}
                        </div>
                    )}
                    <p className="mt-6 text-slate-400">{itemData.description}</p>
                </div>
            </div>
        </div>
    );
};

export default ItemInfo;
