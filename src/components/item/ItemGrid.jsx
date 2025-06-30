import React from 'react';
import Image from '../common/Image';

const ItemGrid = ({ items, onSelectItem, onPinToggle }) => (
    <div className="grid grid-auto-fill gap-8">
        {items.map((item) => (
            <div 
                key={item.id} 
                className="media-card cursor-pointer group relative"
            >
                <button
                    className={`absolute top-2 right-2 z-10 btn btn-xs btn-circle ${item.pinned ? 'btn-warning' : 'btn-ghost'}`}
                    aria-label={item.pinned ? 'Desafixar dos favoritos' : 'Fixar nos favoritos'}
                    title={item.pinned ? 'Desafixar dos favoritos' : 'Fixar nos favoritos'}
                    onClick={e => {
                        e.stopPropagation();
                        if (onPinToggle) onPinToggle(item);
                    }}
                >
                    {item.pinned ? '★' : '☆'}
                </button>
                <div onClick={() => onSelectItem(item)}>
                    <Image
                        src={item.cover?.url}
                        alt={item.cover?.alt || item.title}
                        className="media-card-image"
                        errorSrc="https://placehold.co/300x450/1e293b/94a3b8?text=Capa"
                    />
                    <div className="media-card-content">
                        <h3 className="media-card-title truncate">{item.title}</h3>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export default ItemGrid;
