// AIDEV-NOTE: Hub route handler; loads hub data based on encoded URL parameter
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useHubContext } from '../context/HubContext';
import { decodeHubUrl } from '../utils/urlDecoder';
import HubView from './HubView';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';

const HubRouteHandler = () => {
    const { encodedUrl } = useParams();
    const { loadHub, currentHubData, hubLoading, hubError } = useHubContext();

    // AIDEV-NOTE: Load hub data when encodedUrl changes with improved error handling
    useEffect(() => {
        if (encodedUrl) {
            try {
                console.log('🔍 [HubRouteHandler] Received encodedUrl:', encodedUrl);
                
                // AIDEV-NOTE: Use centralized URL decoding logic
                const hubUrl = decodeHubUrl(encodedUrl);
                
                console.log('🔗 [HubRouteHandler] Final URL for loading:', hubUrl);
                loadHub(hubUrl);
            } catch (error) {
                console.error('❌ [HubRouteHandler] Error decoding URL:', error);
                // AIDEV-NOTE: Don't crash the app, just log the error
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
                                // AIDEV-NOTE: Use same centralized logic for retry
                                const hubUrl = decodeHubUrl(encodedUrl);
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
