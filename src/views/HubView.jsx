import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import HubHeader from '../components/hub/HubHeader';
import ItemGrid from '../components/item/ItemGrid';

const HubView = () => {
    const { currentHubData, selectItem, togglePinStatus } = useAppContext();
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    // Otimização: A lista filtrada só é recalculada se a lista original ou o termo de pesquisa mudarem.
    const filteredSeries = useMemo(() => {
        if (!currentHubData?.series) {
            return [];
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return currentHubData.series.filter(item =>
            item.title.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }, [currentHubData?.series, searchTerm]);

    // Otimização: A função não é recriada em cada renderização.
    const handleSelectItem = useCallback(async (item) => {
        // A ação de selecionar o item é disparada, mas não precisamos esperar (await).
        // A ItemDetailView já gerencia o seu próprio estado de carregamento.
        selectItem(item, currentHubData.hub.id);
        navigate(`/series/${item.slug}`);
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
