import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import ItemInfo from '../components/item/ItemInfo';
import EntryList from '../components/item/EntryList';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';

const ItemDetailView = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { currentHubData, selectedItemData, selectItem, clearSelectedItem, itemLoading, itemError } = useAppContext();
    const itemFromHub = currentHubData?.series.find(i => i.slug === slug);

    React.useEffect(() => {
        if (itemFromHub && currentHubData?.hub?.id && (!selectedItemData || selectedItemData.slug !== slug)) {
            selectItem(itemFromHub, currentHubData.hub.id);
        }
    }, [itemFromHub, slug, currentHubData?.hub?.id, selectedItemData, selectItem]);

    if (itemLoading) {
        return <div className="min-h-[50vh] flex items-center justify-center"><Spinner text="Carregando detalhes da série..." /></div>;
    }
    if (itemError) {
        return <ErrorMessage message={itemError} onRetry={() => selectItem(itemFromHub, currentHubData.hub.id)} />;
    }
    if (!selectedItemData || !itemFromHub) {
        return <div className="min-h-[50vh] flex items-center justify-center"><Spinner text="Preparando série..." /></div>;
    }

    return (
        <>
            <div className="mb-4">
                <Button onClick={() => { clearSelectedItem(); navigate('/'); }} className="btn-secondary">
                    &larr; Voltar para a lista
                </Button>
            </div>
            <ItemInfo itemData={{ ...itemFromHub, ...selectedItemData }} />
            {/* A lista de capítulos agora renderiza corretamente */}
            {selectedItemData.entries && Array.isArray(selectedItemData.readChapterKeys) && (
                <EntryList
                    itemData={selectedItemData}
                    onSelectEntry={entryKey => navigate(`/series/${itemFromHub.slug}/read/${entryKey}`)}
                    readChapters={selectedItemData.readChapterKeys}
                />
            )}
        </>
    );
};

export default ItemDetailView;
