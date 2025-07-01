import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import HubHeader from '../components/hub/HubHeader';
import ItemGrid from '../components/item/ItemGrid';
import { encodeUrl } from '../utils/encoding';

const HubView = () => {
    const { currentHubData, selectItem, togglePinStatus } = useAppContext();
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    const allItems = useMemo(() => {
        return currentHubData?.series || [];
    }, [currentHubData?.series]);

    const filteredSeries = useMemo(() => {
        if (!allItems) {
            return [];
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return allItems.filter(item =>
            item.title.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }, [allItems, searchTerm]);

    const handleSelectItem = useCallback(async (item) => {
        const uniqueId = `${currentHubData.hub.id}:${item.slug}`;
        const encodedId = encodeUrl(uniqueId);
        selectItem(item, currentHubData.hub.id);
        navigate(`/series/${encodedId}`);
    }, [selectItem, currentHubData?.hub?.id, navigate]);

    return (
        <>
            <HubHeader hub={currentHubData.hub} />
            <div className="mb-8">
                <input
                    type="text"
                    placeholder="Pesquisar por título..."
                    className="form-input"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <ItemGrid
                items={filteredSeries}
                onSelectItem={handleSelectItem}
                onPinToggle={togglePinStatus}
            />
        </>
    );
};

export default HubView;
