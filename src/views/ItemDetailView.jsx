import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import ItemInfo from '../components/item/ItemInfo';
import EntryList from '../components/item/EntryList';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';
import { decodeUrl, encodeUrl } from '../utils/encoding';

const ItemDetailView = () => {
    // Recebe o ID codificado da URL
    const { encodedId } = useParams();
    const navigate = useNavigate();
    const { 
        currentHubData, 
        selectedItemData, 
        selectItem, 
        clearSelectedItem, 
        itemLoading, 
        itemError,
        isOffline,
        togglePinStatus
    } = useAppContext();

    const [sortOrder, setSortOrder] = useState('asc');

    useEffect(() => {
        if (!currentHubData) return;
        // Decodifica o ID para obter o hubId e o slug
        const decodedId = decodeUrl(encodedId);
        const [hubId, slug] = decodedId.split(':');
        const itemFromHub = currentHubData.series.find(i => i.slug === slug);
        if (itemFromHub) {
            if (!selectedItemData || selectedItemData.slug !== slug) {
                selectItem(itemFromHub, hubId);
            }
        } else {
            console.error(`Item com slug "${slug}" não encontrado no hub atual.`);
        }
    }, [encodedId, currentHubData, selectItem, selectedItemData]);

    const handleGoBack = () => {
        clearSelectedItem();
        navigate('/');
    };

    if (itemLoading || !selectedItemData) {
        return <div className="flex items-center justify-center min-h-[50vh]"><Spinner text="A carregar detalhes da série..." /></div>;
    }
    
    if (itemError) {
        return <ErrorMessage message={itemError} onRetry={() => {
            const [hubId, slug] = decodeUrl(encodedId).split(':');
            const itemToRetry = currentHubData?.series.find(i => i.slug === slug);
            if (itemToRetry && hubId) selectItem(itemToRetry, hubId);
        }} />;
    }

    return (
        <div className="fade-in">
             <div className="mb-4">
                <Button onClick={handleGoBack} className="btn-secondary">
                    &larr; Voltar para a lista
                </Button>
            </div>
            <ItemInfo
                itemData={selectedItemData}
                pinned={selectedItemData.pinned}
                onPinToggle={() => togglePinStatus(selectedItemData)}
            />

            {selectedItemData.entries && (
                <EntryList
                    itemData={selectedItemData}
                    // Ao selecionar um capítulo, cria a nova URL codificada para o leitor
                    onSelectEntry={entryKey => navigate(`/read/${encodedId}/${encodeUrl(entryKey)}`)}
                    readChapters={selectedItemData.readChapterKeys}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                    isOnline={!isOffline}
                />
            )}
        </div>
    );
};

export default ItemDetailView;
