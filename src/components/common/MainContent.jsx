import { useAppContext } from '../../context/AppContext';
import { useRemoteStorageContext } from '../../context/RemoteStorageContext';
import { useLocation } from 'react-router-dom';
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
    const location = useLocation();

    // Log controlado apenas para mudanças significativas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
        if (hubLoading || hubError || (currentHubData && !window._hubLoadedLogged)) {
            console.log('🎯 [MainContent] Estado atual:', { 
                currentHubData: !!currentHubData, 
                hubLoading, 
                hubError, 
                isConnected,
                hubTitle: currentHubData?.hub?.title 
            });
            
            if (currentHubData) {
                window._hubLoadedLogged = true;
            }
        }
    }

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

    // Se não conectado, SEMPRE mostra HubLoader na rota principal ('/') 
    // independente de ter currentHubData ou não
    if (!isConnected) {
        // Na rota principal ('/'), sempre mostra HubLoader para permitir carregar novo hub
        if (location.pathname === '/') {
            return (
                <div className="p-4">
                    <HubLoader loading={hubLoading} />
                </div>
            );
        }
        
        // Em outras rotas, pode mostrar HubView se tiver dados
        if (currentHubData) {
            return <HubView />;
        }
        
        // Fallback para HubLoader
        return (
            <div className="p-4">
                <HubLoader loading={hubLoading} />
            </div>
        );
    }

    // Se conectado mas sem hub carregado, mostra HubLoader (versão conectada com cards)
    if (!currentHubData) {
        return <HubLoader loading={hubLoading} />;
    }

    // Se conectado E tem hub carregado, mostra HubView com os dados do hub
    return <HubView />;
}

export default MainContent;