import React from 'react';
import HubHeader from '../components/hub/HubHeader';
import ItemGrid from '../components/item/ItemGrid';

const HubView = ({ hub, series, onSelectItem, searchTerm, onSearchChange }) => {
    return (
        <>
            <HubHeader hub={hub} />
            <div className="mb-8">
                <input
                    type="text"
                    placeholder="Pesquisar por título..."
                    className="form-input"
                    value={searchTerm}
                    onChange={onSearchChange}
                />
            </div>
            <ItemGrid items={series} onSelectItem={onSelectItem} />
        </>
    );
};

export default HubView;
