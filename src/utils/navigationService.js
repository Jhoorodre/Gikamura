// AIDEV-NOTE: Centralized navigation service to eliminate duplication and ensure consistency
import { encodeUrl } from './encoding';

/**
 * AIDEV-NOTE: Centralized navigation service for consistent URL construction
 */
export class NavigationService {
    constructor(navigate) {
        this.navigate = navigate;
    }

    /**
     * Navigate to hub page with encoded URL
     */
    toHub(hubUrl, options = {}) {
        if (!hubUrl) {
            throw new Error('Hub URL is required');
        }
        
        const encodedUrl = encodeUrl(hubUrl);
        const path = `/hub/${encodedUrl}`;
        
        if (options.replace) {
            this.navigate(path, { replace: true });
        } else {
            this.navigate(path);
        }
        
        return path;
    }

    /**
     * Navigate to manga detail page
     */
    toManga(readerUrl, options = {}) {
        if (!readerUrl) {
            throw new Error('Reader URL is required');
        }
        
        const encodedUrl = encodeUrl(readerUrl);
        const path = `/manga/${encodedUrl}`;
        
        if (options.replace) {
            this.navigate(path, { replace: true });
        } else {
            this.navigate(path);
        }
        
        return path;
    }

    /**
     * Navigate to chapter reader
     */
    toReader(readerUrl, chapterId, options = {}) {
        if (!readerUrl) {
            throw new Error('Reader URL is required');
        }
        if (!chapterId) {
            throw new Error('Chapter ID is required');
        }
        
        const encodedUrl = encodeUrl(readerUrl);
        const encodedChapterId = encodeUrl(chapterId);
        const path = `/reader/${encodedUrl}/${encodedChapterId}`;
        
        if (options.replace) {
            this.navigate(path, { replace: true });
        } else {
            this.navigate(path);
        }
        
        return path;
    }

    /**
     * Navigate to collection page
     */
    toCollection(options = {}) {
        const path = '/collection';
        
        if (options.replace) {
            this.navigate(path, { replace: true });
        } else {
            this.navigate(path);
        }
        
        return path;
    }

    /**
     * Navigate to works page
     */
    toWorks(options = {}) {
        const path = '/works';
        
        if (options.replace) {
            this.navigate(path, { replace: true });
        } else {
            this.navigate(path);
        }
        
        return path;
    }

    /**
     * Navigate to upload page
     */
    toUpload(options = {}) {
        const path = '/upload';
        
        if (options.replace) {
            this.navigate(path, { replace: true });
        } else {
            this.navigate(path);
        }
        
        return path;
    }

    /**
     * Navigate to home page
     */
    toHome(options = {}) {
        const path = '/';
        
        if (options.replace) {
            this.navigate(path, { replace: true });
        } else {
            this.navigate(path);
        }
        
        return path;
    }

    /**
     * Go back in browser history
     */
    back() {
        this.navigate(-1);
    }

    /**
     * Generate URL without navigating
     */
    static generateUrl = {
        hub: (hubUrl) => `/hub/${encodeUrl(hubUrl)}`,
        manga: (readerUrl) => `/manga/${encodeUrl(readerUrl)}`,
        reader: (readerUrl, chapterId) => `/reader/${encodeUrl(readerUrl)}/${encodeUrl(chapterId)}`,
        collection: () => '/collection',
        works: () => '/works',
        upload: () => '/upload',
        home: () => '/'
    };

    /**
     * AIDEV-NOTE: Generate clean URLs for sharing (without basename)
     */
    static generateShareUrl = (url = window.location.href) => {
        try {
            // Se é uma URL completa, criar objeto URL
            if (url.startsWith('http')) {
                const urlObj = new URL(url);
                let pathname = urlObj.pathname;
                
                // Remove basename /gikamura se presente
                if (pathname.startsWith('/gikamura')) {
                    pathname = pathname.replace('/gikamura', '') || '/';
                }
                
                // Reconstrói a URL sem o basename
                return `${urlObj.origin}${pathname}${urlObj.search}${urlObj.hash}`;
            }
            
            // Se é uma URL relativa, apenas remove o basename
            let cleanUrl = url;
            if (cleanUrl.startsWith('/gikamura')) {
                cleanUrl = cleanUrl.replace('/gikamura', '') || '/';
            }
            
            return cleanUrl;
        } catch (error) {
            console.error('Erro ao gerar URL de compartilhamento:', error);
            return url; // Retorna a URL original em caso de erro
        }
    };

    /**
     * AIDEV-NOTE: Generate share data with clean URLs
     */
    static generateShareData = ({ title, text, url = null }) => {
        const shareUrl = url ? NavigationService.generateShareUrl(url) : NavigationService.generateShareUrl();
        
        return {
            title,
            text,
            url: shareUrl
        };
    };
}

/**
 * AIDEV-NOTE: Hook for using navigation service
 */
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

export const useNavigationService = () => {
    const navigate = useNavigate();
    
    const navigationService = useMemo(() => new NavigationService(navigate), [navigate]);
    
    return navigationService;
};