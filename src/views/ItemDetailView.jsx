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
        itemError,
        isOffline,
        togglePinStatus
    } = useAppContext();

    // Adiciona o estado para controlar a ordem de ordenação
    const [sortOrder, setSortOrder] = useState('asc');

    useEffect(() => {
        // Se os dados do hub ainda não foram carregados, não podemos fazer nada.
        if (!currentHubData) {
            return;
        }

        const itemFromHub = currentHubData.series.find(i => i.slug === slug);

        if (itemFromHub) {
            // Apenas busca os dados se o item correto já não estiver carregado.
            if (!selectedItemData || selectedItemData.slug !== slug) {
                selectItem(itemFromHub, currentHubData.hub.id);
            }
        } else {
            console.error(`Item com slug "${slug}" não encontrado no hub atual.`);
            // Opcional: Redirecionar para a home se o slug for inválido.
            // navigate('/');
        }
    }, [slug, currentHubData, selectItem, selectedItemData]);

    const handleGoBack = () => {
        clearSelectedItem();
        navigate('/');
    };

    if (itemLoading || !selectedItemData) {
        return <div className="flex items-center justify-center min-h-[50vh]"><Spinner text="A carregar detalhes da série..." /></div>;
    }
    
    if (itemError) {
        // Garante que onRetry tenha os dados necessários para tentar novamente.
        const itemToRetry = currentHubData?.series.find(i => i.slug === slug);
        const hubIdToRetry = currentHubData?.hub?.id;
        return <ErrorMessage message={itemError} onRetry={itemToRetry && hubIdToRetry ? () => selectItem(itemToRetry, hubIdToRetry) : undefined} />;
    }

    return (
        <div className="fade-in">
             <div className="mb-4">
                <Button onClick={handleGoBack} className="btn-secondary">
                    &larr; Voltar para a lista
                </Button>
            </div>
            {/* Este componente agora recebe os dados corretos e unificados */}
            <ItemInfo
                itemData={selectedItemData}
                pinned={selectedItemData.pinned}
                onPinToggle={() => togglePinStatus(selectedItemData)}
            />

            {selectedItemData.entries && (
                <EntryList
                    itemData={selectedItemData}
                    onSelectEntry={entryKey => navigate(`/series/${slug}/read/${entryKey}`)}
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
