import React from 'react';
import Image from '../common/Image';

const ItemGrid = ({ items, onSelectItem, onPinToggle }) => (
    <div className="grid grid-auto-fill gap-8">
        {items.map((item) => (
            <div 
                key={item.id} 
                className="media-card cursor-pointer group relative"
            >
                {/* O botão de fixar não deve aparecer no card estático */}
                {onPinToggle && !item.isStatic && (
                    <button
                        className={`absolute top-2 right-2 z-10 btn btn-sm btn-circle ${item.pinned ? 'btn-warning' : 'btn-ghost'}`}
                        aria-label={item.pinned ? 'Desafixar dos favoritos' : 'Fixar nos favoritos'}
                        title={item.pinned ? 'Desafixar dos favoritos' : 'Fixar nos favoritos'}
                        onClick={e => {
                            e.stopPropagation();
                            onPinToggle(item);
                        }}
                    >
                        {item.pinned ? '★' : '☆'}
                    </button>
                )}
                <div onClick={() => onSelectItem(item)}>
                    {/* Renderiza ícone se existir, senão imagem */}
                    {item.iconComponent ? (
                        <div className="media-card-image flex items-center justify-center bg-slate-800/50">
                            {React.createElement(item.iconComponent)}
                        </div>
                    ) : (
                        <Image
                            src={item.cover?.url}
                            alt={item.cover?.alt || item.title}
                            className="media-card-image"
                            errorSrc="https://placehold.co/300x450/1e293b/94a3b8?text=Capa"
                        />
                    )}
                    <div className="media-card-content">
                        <h3 className="media-card-title truncate">{item.title}</h3>
                        {item.subtitle && <p className="media-card-subtitle truncate">{item.subtitle}</p>}
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export default ItemGrid;
