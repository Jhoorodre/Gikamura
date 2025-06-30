import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import HubHeader from '../components/hub/HubHeader';
import ItemGrid from '../components/item/ItemGrid';

const HubView = () => {
    const { currentHubData, selectItem } = useAppContext();
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();
    const filteredSeries = currentHubData.series.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const handleSelectItem = async (item) => {
        await selectItem(item);
        navigate(`/series/${item.slug}`);
    };
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
            <ItemGrid items={filteredSeries} onSelectItem={handleSelectItem} />
        </>
    );
};

export default HubView;
