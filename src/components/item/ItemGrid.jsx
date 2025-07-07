// src/components/item/ItemGrid.jsx

// AIDEV-NOTE: Grid de itens com design system aprimorado e proporções harmoniosas
import { memo, createElement } from 'react';
import Image from '../common/Image';
import { FixedSizeGrid as Grid } from 'react-window'; // AIDEV-NOTE: Para virtualização de listas

const ItemGrid = memo(({ items, onSelectItem, onPinToggle }) => (
    <div className="min-item-grid">
        {/* AIDEV-NOTE: Filtra itens sem chave única válida e cria chave única baseada em source+slug+title */}
        {items.filter(item => item && (item.id || item.slug || item.title)).map((item, index) => {
            // AIDEV-NOTE: Cria chave única para evitar duplicatas React
            const uniqueKey = item.source && item.slug ? 
                `${item.source}-${item.slug}` : 
                item.id || 
                `${item.title?.replace(/[^\w]/g, '')}-${index}`;
            
            return (
                <div 
                    key={uniqueKey}
                    className="min-item-card"
                    tabIndex={0}
                    onClick={() => onSelectItem(item)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelectItem(item);
                        }
                    }}
                >
                    {/* AIDEV-NOTE: Botão de favoritar com acessibilidade e design system */}
                    {onPinToggle && !item.isStatic && (
                        <button
                            className={`min-item-pin-button ${item.pinned ? 'pinned' : ''}`}
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
                    
                    {/* AIDEV-NOTE: Renderiza ícone ou imagem com fallback e proporção consistente */}
                    {item.iconComponent ? (
                        <div className="min-item-image flex items-center justify-center">
                            {createElement(item.iconComponent)}
                        </div>
                    ) : (
                        <Image
                            src={item.coverUrl || item.cover?.url}
                            alt={item.cover?.alt || item.title}
                            className="min-item-image"
                            errorSrc="https://placehold.co/300x450/1e293b/94a3b8?text=Capa"
                        />
                    )}
                    
                    <div className="min-item-content">
                        <h3 className="min-item-title">{item.title}</h3>
                        {item.subtitle && <p className="min-item-subtitle">{item.subtitle}</p>}
                    </div>
                </div>
            );
        })}
    </div>
));

ItemGrid.displayName = 'ItemGrid';

// AIDEV-NOTE: Grid virtualizado para listas grandes usando react-window
export const ItemGridVirtualized = memo(({ items, onSelectItem, onPinToggle, columnCount = 3, width = 900, height = 800, rowHeight = 450, columnWidth = 300 }) => {
    const rowCount = Math.ceil(items.length / columnCount);
    return (
        <Grid
            columnCount={columnCount}
            columnWidth={columnWidth}
            height={height}
            rowCount={rowCount}
            rowHeight={rowHeight}
            width={width}
        >
            {({ columnIndex, rowIndex, style }) => {
                const index = rowIndex * columnCount + columnIndex;
                const item = items[index];
                if (!item) return null;
                // AIDEV-NOTE: Chave única igual ao grid normal
                const uniqueKey = item.source && item.slug ? `${item.source}-${item.slug}` : item.id || `${item.title?.replace(/[^\w]/g, '')}-${index}`;
                return (
                    <div key={uniqueKey} style={style} className="min-item-card">
                        {/* AIDEV-NOTE: Botão de favoritar com acessibilidade e design system */}
                        {onPinToggle && !item.isStatic && (
                            <button
                                className={`min-item-pin-button ${item.pinned ? 'pinned' : ''}`}
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
                            {item.iconComponent ? (
                                <div className="min-item-image flex items-center justify-center">
                                    {createElement(item.iconComponent)}
                                </div>
                            ) : (
                                <Image
                                    src={item.coverUrl || item.cover?.url}
                                    alt={item.cover?.alt || item.title}
                                    className="min-item-image"
                                    errorSrc="https://placehold.co/300x450/1e293b/94a3b8?text=Capa"
                                />
                            )}
                            <div className="min-item-content">
                                <h3 className="min-item-title">{item.title}</h3>
                                {item.subtitle && <p className="min-item-subtitle">{item.subtitle}</p>}
                            </div>
                        </div>
                    </div>
                );
            }}
        </Grid>
    );
});

export default ItemGrid;