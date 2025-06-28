import React from 'react';
import Image from '../common/Image';

const ItemInfo = ({ itemData, onBackToHub }) => (
    <div className="mb-8">
        <button onClick={onBackToHub} className="btn btn-ghost mb-8">
            &larr; Voltar à Lista
        </button>
        <div className="card flex gap-8">
            <Image
                src={itemData.cover.url}
                alt={itemData.cover.alt}
                className="w-64 h-auto object-cover rounded-xl"
                errorSrc="https://placehold.co/256x384/1e293b/94a3b8?text=Capa"
            />
            <div>
                <h1 className="orbitron">{itemData.title}</h1>
                <p className="text-lg mt-2">
                    por {itemData.author.name}
                </p>
                <div className="flex gap-2 mt-6">
                    {itemData.genres.map(g => (
                        <span key={g} className="badge badge-primary">{g}</span>
                    ))}
                </div>
                <p className="mt-6">{itemData.description}</p>
            </div>
        </div>
    </div>
);

export default ItemInfo;
