// AIDEV-NOTE: Centralized route redirects for backward compatibility
import { useParams, Navigate } from 'react-router-dom';
import { isValidBase64 } from '../../utils/encoding';

/**
 * AIDEV-NOTE: Redirect old reader URLs to new manga URLs
 * /reader/:encodedUrl → /manga/:encodedUrl
 * /leitor/:encodedUrl → /manga/:encodedUrl
 */
export const ReaderToMangaRedirect = () => {
    const { encodedUrl } = useParams();
    
    if (!encodedUrl) {
        if (import.meta.env?.DEV) {
            console.warn('[RouteRedirects] Missing encodedUrl parameter, redirecting to home');
        }
        return <Navigate to="/" replace />;
    }
    
    // AIDEV-NOTE: Validate Base64 parameter before redirecting
    if (!isValidBase64(encodedUrl)) {
        if (import.meta.env?.DEV) {
            console.warn('[RouteRedirects] Invalid Base64 encodedUrl parameter, redirecting to home');
        }
        return <Navigate to="/" replace />;
    }
    
    return <Navigate to={`/manga/${encodedUrl}`} replace />;
};

/**
 * AIDEV-NOTE: Redirect old chapter URLs to new reader URLs
 * /leitor/:encodedUrl/:encodedChapterId → /reader/:encodedUrl/:encodedChapterId
 */
export const LeitorToReaderRedirect = () => {
    const { encodedUrl, encodedChapterId } = useParams();
    
    if (!encodedUrl || !encodedChapterId) {
        if (import.meta.env?.DEV) {
            console.warn('[RouteRedirects] Missing URL parameters, redirecting to home');
        }
        return <Navigate to="/" replace />;
    }
    
    // AIDEV-NOTE: Validate Base64 parameters before redirecting
    if (!isValidBase64(encodedUrl) || !isValidBase64(encodedChapterId)) {
        if (import.meta.env?.DEV) {
            console.warn('[RouteRedirects] Invalid Base64 parameters, redirecting to home');
        }
        return <Navigate to="/" replace />;
    }
    
    return <Navigate to={`/reader/${encodedUrl}/${encodedChapterId}`} replace />;
};

/**
 * AIDEV-NOTE: Generic redirect component for future route changes
 */
export const GenericRedirect = ({ from, to, params = {} }) => {
    const urlParams = useParams();
    
    try {
        // Build target URL with parameters
        let targetUrl = to;
        Object.keys(params).forEach(key => {
            const paramValue = urlParams[params[key]] || params[key];
            if (!paramValue) {
                throw new Error(`Missing parameter: ${key}`);
            }
            targetUrl = targetUrl.replace(`:${key}`, paramValue);
        });
        
        return <Navigate to={targetUrl} replace />;
    } catch (error) {
        if (import.meta.env?.DEV) {
            console.warn('[RouteRedirects] Generic redirect failed:', error.message);
        }
        return <Navigate to="/" replace />;
    }
};