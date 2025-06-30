import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import ItemInfo from '../components/item/ItemInfo';
import EntryList from '../components/item/EntryList';
import Button from '../components/common/Button';

const ItemDetailView = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { currentHubData, selectedItemData, selectItem, clearSelectedItem, readChapters } = useAppContext();
    const item = currentHubData?.series.find(i => i.slug === slug);
    React.useEffect(() => {
        if (item && (!selectedItemData || selectedItemData.slug !== slug)) {
            selectItem(item);
        }
    }, [item, slug]);
    if (!item) return <div>Carregando...</div>;
    return (
        <>
            <div className="mb-4">
                <Button onClick={() => { clearSelectedItem(); navigate('/'); }} className="btn-secondary">
                    &larr; Voltar para a lista
                </Button>
            </div>
            <ItemInfo itemData={item} />
            <EntryList
                itemData={item}
                onSelectEntry={entryKey => navigate(`/series/${item.slug}/read/${entryKey}`)}
                readChapters={readChapters}
            />
        </>
    );
};

export default ItemDetailView;
