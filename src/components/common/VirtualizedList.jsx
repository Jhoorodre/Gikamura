import React, { memo } from 'react';
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = memo(({ 
  items, 
  height = 400, 
  itemHeight = 120, 
  renderItem,
  className = "" 
}) => {
  // Row renderer que será usado pelo react-window
  const Row = ({ index, style }) => {
    const item = items[index];
    
    return (
      <div style={style}>
        {renderItem({ item, index })}
      </div>
    );
  };

  if (!items || items.length === 0) {
    return (
      <div className={`empty-list ${className}`}>
        <p>Nenhum item encontrado</p>
      </div>
    );
  }

  // Para listas pequenas (< 50 itens), renderiza normalmente
  if (items.length < 50) {
    return (
      <div className={`regular-list ${className}`}>
        {items.map((item, index) => 
          renderItem({ item, index })
        )}
      </div>
    );
  }

  // Para listas grandes, usa virtualization
  return (
    <div className={`virtualized-list ${className}`}>
      <List
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        overscanCount={5} // Renderiza 5 itens extras fora da viewport
      >
        {Row}
      </List>
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

export default VirtualizedList;
