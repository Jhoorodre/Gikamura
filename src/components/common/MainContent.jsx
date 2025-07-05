// AIDEV-NOTE: Main content router; handles hub/storage state rendering logic and query parameters
import { useAppContext } from '../../context/AppContext';
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
    const { currentHubData, hubLoading, hubError, loadHub, retryLoadHub, lastAttemptedUrl } = useAppContext();
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

    // AIDEV-NOTE: Always show HubLoader on main route (/) if no query params and no current data
    if (location.pathname === '/') {
        const searchParams = new URLSearchParams(location.search);
        const hubParam = searchParams.get('hub');
        
        // AIDEV-NOTE: If processing hub query parameter, show loading state
        if (hubParam && hubLoading) {
            return <ItemGridSkeleton />;
        }
        
        // AIDEV-NOTE: If hub data loaded from query param, show HubView
        if (hubParam && currentHubData) {
            return <HubView />;
        }
        
        // AIDEV-NOTE: If hub data loaded without query param, show HubView  
        if (currentHubData && !hubParam) {
            return <HubView />;
        }
        
        // AIDEV-NOTE: Default state - show HubLoader for manual input
        if (import.meta.env?.DEV && currentHubData) {
            console.log('🧹 [MainContent] Hub data detected on main route, ensuring clean Hub Loader state');
        }
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