import React from 'react';
import { useAppContext } from '../../context/AppContext';
import ItemGridSkeleton from '../item/ItemGridSkeleton';
import ErrorMessage from './ErrorMessage';
import HubLoader from '../hub/HubLoaderComponent.jsx';
import HubView from '../../views/HubView';

/**
 * Este componente encapsula a lógica de renderização para a rota principal ('/').
 * Ele decide qual componente exibir com base no estado atual do hub.
 */
function MainContent() {
    const { currentHubData, hubLoading, hubError, loadHub } = useAppContext();

    if (hubLoading) {
        return <ItemGridSkeleton />;
    }

    if (hubError) {
        return <ErrorMessage message={hubError} onRetry={() => currentHubData && loadHub(currentHubData.url)} />;
    }

    if (!currentHubData) {
        return <HubLoader onLoadHub={loadHub} loading={hubLoading} />;
    }

    return <HubView />;
}

export default MainContent;