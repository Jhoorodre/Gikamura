// AIDEV-NOTE: Hub route handler; loads hub data based on encoded URL parameter
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useHubContext } from '../context/HubContext';
import { decodeUrl } from '../utils/encoding';
import HubView from './HubView';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';

const HubRouteHandler = () => {
    const { encodedUrl } = useParams();
    const { loadHub, currentHubData, hubLoading, hubError } = useHubContext();

    // AIDEV-NOTE: Load hub data when encodedUrl changes
    useEffect(() => {
        if (encodedUrl) {
            try {
                const hubUrl = decodeUrl(encodedUrl);
                console.log('🔗 [HubRouteHandler] Loading hub from URL:', hubUrl);
                loadHub(hubUrl);
            } catch (error) {
                console.error('❌ [HubRouteHandler] Error decoding URL:', error);
            }
        }
    }, [encodedUrl, loadHub]);

    // AIDEV-NOTE: Show loading state while hub is loading
    if (hubLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner text="Carregando hub..." />
            </div>
        );
    }

    // AIDEV-NOTE: Show error state if hub failed to load
    if (hubError) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <ErrorMessage 
                    message={hubError} 
                    onRetry={() => {
                        if (encodedUrl) {
                            try {
                                const hubUrl = decodeUrl(encodedUrl);
                                loadHub(hubUrl);
                            } catch (error) {
                                console.error('❌ [HubRouteHandler] Retry error:', error);
                            }
                        }
                    }} 
                />
            </div>
        );
    }

    // AIDEV-NOTE: Show HubView once data is loaded
    return <HubView />;
};

export default HubRouteHandler;
