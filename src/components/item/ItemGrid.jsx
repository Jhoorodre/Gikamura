import React from 'react';
import Image from '../common/Image';

const ItemGrid = ({ items, onSelectItem }) => (
    <div className="grid grid-auto-fill gap-8">
        {items.map((item) => (
            <div 
                key={item.id} 
                onClick={() => onSelectItem(item)} 
                className="media-card cursor-pointer"
            >
                <Image
                    src={item.cover.url}
                    alt={item.cover.alt}
                    className="media-card-image"
                    errorSrc="https://placehold.co/300x450/1e293b/94a3b8?text=Capa"
                />
                <div className="media-card-content">
                    <h3 className="media-card-title truncate">{item.title}</h3>
                </div>
            </div>
        ))}
    </div>
);

export default ItemGrid;
