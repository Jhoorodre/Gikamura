// AIDEV-NOTE: Main content router; handles hub/storage state rendering logic
import { useAppContext } from '../../context/AppContext';
import { useRemoteStorageContext } from '../../context/RemoteStorageContext';
import { useLocation } from 'react-router-dom';
import ItemGridSkeleton from '../item/ItemGridSkeleton';
import ErrorMessage from './ErrorMessage';
import HubLoader from '../hub/HubLoaderComponent.jsx';
import HubView from '../../views/HubView';

/**
 * AIDEV-NOTE: Encapsulates rendering logic for main route ('/') 
 * Decides which component to display based on hub and connection state
 */
function MainContent() {
    const { currentHubData, hubLoading, hubError, loadHub, retryLoadHub, lastAttemptedUrl } = useAppContext();
    const { isConnected } = useRemoteStorageContext() || { isConnected: false };
    const location = useLocation();

    // AIDEV-NOTE: Controlled logging only for significant changes in dev mode
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
                    // AIDEV-NOTE: Try retry function first, fallback to loadHub
                    if (retryLoadHub) {
                        retryLoadHub();
                    } else if (lastAttemptedUrl) {
                        loadHub(lastAttemptedUrl);
                    }
                }} 
            />
        );
    }

    // AIDEV-NOTE: Always show HubLoader on main route (/) regardless of connection or data
    if (location.pathname === '/') {
        return <HubLoader loading={hubLoading} />;
    }

    // AIDEV-NOTE: If not connected, show HubView if data exists, otherwise HubLoader
    if (!isConnected) {
        if (currentHubData) {
            return <HubView />;
        }
        
        // AIDEV-NOTE: Fallback to HubLoader
        return (
            <div className="p-4">
                <HubLoader loading={hubLoading} />
            </div>
        );
    }

    // AIDEV-NOTE: Connected but no hub loaded - show HubLoader with cards
    if (!currentHubData) {
        return <HubLoader loading={hubLoading} />;
    }

    // AIDEV-NOTE: Connected AND has hub loaded - show HubView with hub data
    return <HubView />;
}

export default MainContent;