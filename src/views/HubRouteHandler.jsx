// AIDEV-NOTE: Hub route handler; loads hub data based on encoded URL parameter
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useHubContext } from '../context/HubContext';
import { decodeHubUrl } from '../utils/urlDecoder';
import { useRouteError } from '../hooks/useRouteError';
import HubView from './HubView';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';
import RouteErrorBoundary from '../components/common/RouteErrorBoundary';

const HubRouteHandler = () => {
    const { encodedUrl } = useParams();
    const { loadHub, currentHubData, hubLoading, hubError } = useHubContext();
    const { handleRouteError, safeAsyncOperation } = useRouteError({
        redirectOnError: true,
        redirectPath: '/'
    });

    // AIDEV-NOTE: Load hub data when encodedUrl changes with standardized error handling
    useEffect(() => {
        if (encodedUrl) {
            safeAsyncOperation(async () => {
                // AIDEV-NOTE: Use centralized URL decoding logic
                const hubUrl = decodeHubUrl(encodedUrl);
                await loadHub(hubUrl);
            }, {
                operation: 'hub_loading',
                encodedUrl,
                route: '/hub/:encodedUrl'
            }).catch(() => {
                // Error is already handled by useRouteError
            });
        }
    }, [encodedUrl, loadHub, safeAsyncOperation]);

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
                                if (import.meta.env?.DEV) {
                                    console.error('❌ [HubRouteHandler] Retry error:', error);
                                }
                            }
                        }
                    }} 
                />
            </div>
        );
    }

    // AIDEV-NOTE: Show HubView once data is loaded with error boundary
    return (
        <RouteErrorBoundary
            title="Erro ao carregar hub"
            onError={(errorInfo) => {
                // Optional: send error to monitoring service
                if (import.meta.env?.DEV) {
                    console.error('[HubRouteHandler] Route error:', errorInfo);
                }
            }}
        >
            <HubView />
        </RouteErrorBoundary>
    );
};

export default HubRouteHandler;
