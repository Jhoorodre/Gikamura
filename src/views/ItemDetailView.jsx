import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import ItemInfo from '../components/item/ItemInfo';
import EntryList from '../components/item/EntryList';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';

const ItemDetailView = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { 
        currentHubData, 
        selectedItemData, 
        selectItem, 
        clearSelectedItem, 
        itemLoading, 
        itemError 
    } = useAppContext();

    // Adiciona o estado para controlar a ordem de ordenação
    const [sortOrder, setSortOrder] = useState('asc');

    const itemFromHub = currentHubData?.series.find(i => i.slug === slug);

    useEffect(() => {
        if (itemFromHub && (!selectedItemData || selectedItemData.slug !== slug)) {
            selectItem(itemFromHub, currentHubData.hub.id);
        }
        // Limpa os dados ao sair da página para forçar recarregamento
        return () => {
            clearSelectedItem();
        };
    }, [itemFromHub, slug, currentHubData?.hub?.id]);

    const handleGoBack = () => {
        clearSelectedItem();
        navigate('/');
    };

    if (itemLoading || !selectedItemData) {
        return <div className="flex items-center justify-center min-h-[50vh]"><Spinner text="A carregar detalhes da série..." /></div>;
    }
    
    if (itemError) {
        return <ErrorMessage message={itemError} onRetry={() => selectItem(itemFromHub, currentHubData.hub.id)} />;
    }

    return (
        <div className="fade-in">
             <div className="mb-4">
                <Button onClick={handleGoBack} className="btn-secondary">
                    &larr; Voltar para a lista
                </Button>
            </div>
            {/* Este componente agora recebe os dados corretos e unificados */}
            <ItemInfo itemData={selectedItemData} />

            {selectedItemData.entries && (
                <EntryList
                    itemData={selectedItemData}
                    onSelectEntry={entryKey => navigate(`/series/${slug}/read/${entryKey}`)}
                    readChapters={selectedItemData.readChapterKeys}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                />
            )}
        </div>
    );
};

export default ItemDetailView;
