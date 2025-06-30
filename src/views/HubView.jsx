import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import HubHeader from '../components/hub/HubHeader';
import ItemGrid from '../components/item/ItemGrid';
import { BookOpenIcon } from '../components/common/Icones';

const HubView = () => {
    const { currentHubData, selectItem, togglePinStatus, isConnected } = useAppContext();
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    const allItems = useMemo(() => {
        const series = currentHubData?.series || [];
        const libraryCard = {
            id: 'library-card',
            title: 'Biblioteca',
            subtitle: 'Séries fixadas e histórico',
            iconComponent: BookOpenIcon,
            isStatic: true
        };
        if (isConnected) {
            return [libraryCard, ...series];
        }
        return series;
    }, [currentHubData?.series, isConnected]);

    const filteredSeries = useMemo(() => {
        if (!allItems) {
            return [];
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return allItems.filter(item =>
            item.title.toLowerCase().includes(lowerCaseSearchTerm) ||
            (item.subtitle && item.subtitle.toLowerCase().includes(lowerCaseSearchTerm))
        );
    }, [allItems, searchTerm]);

    const handleSelectItem = useCallback(async (item) => {
        if (item.isStatic) {
            navigate('/library');
            return;
        }
        const uniqueId = `${currentHubData.hub.id}:${item.slug}`;
        const encodedId = btoa(uniqueId);
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
