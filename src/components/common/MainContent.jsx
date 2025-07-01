
import { useAppContext } from '../../context/AppContext';
import { useRemoteStorageContext } from '../../context/RemoteStorageContext';
import ItemGridSkeleton from '../item/ItemGridSkeleton';
import ErrorMessage from './ErrorMessage';
import HubLoader from '../hub/HubLoaderComponent.jsx';
import HubView from '../../views/HubView';

/**
 * Este componente encapsula a lógica de renderização para a rota principal ('/').
 * Ele decide qual componente exibir com base no estado atual do hub e conexão Remote Storage.
 */
function MainContent() {
    const { currentHubData, hubLoading, hubError, loadHub, retryLoadHub, lastAttemptedUrl } = useAppContext();
    const { isConnected } = useRemoteStorageContext() || { isConnected: false };

    if (hubLoading) {
        return <ItemGridSkeleton />;
    }

    if (hubError) {
        return (
            <ErrorMessage 
                message={hubError} 
                onRetry={() => {
                    // Tenta usar a função de retry primeiro, senão usa loadHub
                    if (retryLoadHub) {
                        retryLoadHub();
                    } else if (lastAttemptedUrl) {
                        loadHub(lastAttemptedUrl);
                    }
                }} 
            />
        );
    }

    // Se não conectado, sempre mostra HubLoader (versão anônima)
    if (!isConnected) {
        return <HubLoader onLoadHub={loadHub} loading={hubLoading} />;
    }

    // Se conectado mas sem hub carregado, mostra HubLoader (versão conectada com cards)
    if (!currentHubData) {
        return <HubLoader onLoadHub={loadHub} loading={hubLoading} />;
    }

    // Se conectado E tem hub carregado, mostra HubView com os dados do hub
    return <HubView />;
}

export default MainContent;