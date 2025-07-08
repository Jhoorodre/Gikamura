// AIDEV-NOTE: Centralized URL decoding logic for consistent handling across routing
import { decodeUrl } from './encoding';

/**
 * AIDEV-NOTE: Centralized URL decoding with Base64-first approach
 * Prioritizes Base64 URL-safe decoding with fallback to URI decoding
 */
export const decodeHubUrl = (encodedUrl) => {
    if (!encodedUrl) {
        throw new Error('URL is required');
    }
    
    try {
        // AIDEV-NOTE: Try Base64 decoding first (preferred method)
        try {
            const decoded = decodeUrl(encodedUrl);
            return decoded;
        } catch (base64Error) {
            // AIDEV-NOTE: Fallback to URI decoding for legacy support only
            const decoded = decodeURIComponent(encodedUrl);
            return decoded;
        }
    } catch (error) {
        if (import.meta.env?.DEV) {
            console.error('❌ [URLDecoder] All decoding methods failed:', error);
        }
        throw new Error(`Failed to decode URL: ${error.message}`);
    }
};

/**
 * AIDEV-NOTE: Validate that decoded URL is safe for external redirection
 */
export const validateExternalUrl = (url) => {
    if (!url) {
        throw new Error('URL is required for validation');
    }
    
    // Basic validation for external URLs
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error('Invalid URL: Must start with http:// or https://');
    }
    
    // Additional security checks can be added here
    // e.g., blacklist certain domains, check for suspicious patterns
    
    return true;
};

/**
 * AIDEV-NOTE: Safe URL decoder with validation for external redirects
 */
export const decodeAndValidateExternalUrl = (encodedUrl) => {
    try {
        const decodedUrl = decodeHubUrl(encodedUrl);
        validateExternalUrl(decodedUrl);
        return decodedUrl;
    } catch (error) {
        if (import.meta.env?.DEV) {
            console.error('❌ [URLDecoder] Validation failed:', error);
        }
        throw error;
    }
};