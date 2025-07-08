// AIDEV-NOTE: Centralized route redirects for backward compatibility
import { useParams, Navigate } from 'react-router-dom';

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
    
    return <Navigate to={`/reader/${encodedUrl}/${encodedChapterId}`} replace />;
};

/**
 * AIDEV-NOTE: Generic redirect component for future route changes
 */
export const GenericRedirect = ({ from, to, params = {} }) => {
    const urlParams = useParams();
    
    // Build target URL with parameters
    let targetUrl = to;
    Object.keys(params).forEach(key => {
        const paramValue = urlParams[params[key]] || params[key];
        targetUrl = targetUrl.replace(`:${key}`, paramValue);
    });
    
    return <Navigate to={targetUrl} replace />;
};