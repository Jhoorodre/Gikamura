// AIDEV-NOTE: Main content router; handles hub/storage state rendering logic and query parameters
import { useAppContext } from '../../context/AppContext';
import { useHubContext } from '../../context/HubContext';
import { useRemoteStorageContext } from '../../context/RemoteStorageContext';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { decodeUrl } from '../../utils/encoding';
import ItemGridSkeleton from '../item/ItemGridSkeleton';
import ErrorMessage from './ErrorMessage';
import HubLoader from '../hub/HubLoaderComponent.jsx';
import HubView from '../../views/HubView';

/**
 * AIDEV-NOTE: Encapsulates rendering logic for main route ('/') 
 * Decides which component to display based on hub and connection state
 * Processes query parameters like ?hub=encodedUrl from Collection page
 */
function MainContent() {
    const { currentHubData, hubLoading, hubError, loadHub, retryLoadHub, lastAttemptedUrl } = useHubContext();
    const { isConnected } = useRemoteStorageContext() || { isConnected: false };
    const location = useLocation();

    // AIDEV-NOTE: Process query parameters on main route to load hubs from Collection
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const hubParam = searchParams.get('hub');
        
        if (hubParam && location.pathname === '/') {
            try {
                const decodedHubUrl = decodeUrl(hubParam);
                console.log('🔗 [MainContent] Loading hub from query parameter:', decodedHubUrl);
                loadHub(decodedHubUrl);
                
                // AIDEV-NOTE: Clean URL after loading to prevent re-loading on refresh
                window.history.replaceState({}, '', location.pathname);
            } catch (error) {
                console.error('❌ [MainContent] Error decoding hub URL from query parameter:', error);
            }
        }
    }, [location.search, location.pathname, loadHub]);

    // AIDEV-NOTE: Controlled logging only for significant changes in dev mode
    if (import.meta.env?.DEV) {
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

    // AIDEV-NOTE: Loading state - always show skeleton while loading
    if (hubLoading) {
        return <ItemGridSkeleton />;
    }

    // AIDEV-NOTE: Error state - always show error with retry
    if (hubError) {
        return (
            <ErrorMessage 
                message={hubError} 
                onRetry={() => {
                    if (retryLoadHub) {
                        retryLoadHub();
                    } else if (lastAttemptedUrl) {
                        loadHub(lastAttemptedUrl);
                    }
                }} 
            />
        );
    }

    // AIDEV-NOTE: Main route (/) behavior depends on connection and hub state
    if (location.pathname === '/') {
        const searchParams = new URLSearchParams(location.search);
        const hubParam = searchParams.get('hub');
        
        // AIDEV-NOTE: Processing hub from query parameter
        if (hubParam && currentHubData) {
            return <HubView />;
        }
        
        // AIDEV-NOTE: If connected and has hub data, show HubView (allows proper navigation)
        if (isConnected && currentHubData) {
            return <HubView />;
        }
        
        // AIDEV-NOTE: Default: show HubLoader for loading new hubs
        return <HubLoader loading={hubLoading} />;
    }

    // AIDEV-NOTE: Non-main routes: show hub data if available, otherwise HubLoader
    if (currentHubData) {
        return <HubView />;
    }

    return <HubLoader loading={hubLoading} />;
}

export default MainContent;