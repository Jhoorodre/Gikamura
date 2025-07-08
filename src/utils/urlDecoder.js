// AIDEV-NOTE: Centralized URL decoding logic for consistent handling across routing
import { decodeUrl } from './encoding';

/**
 * AIDEV-NOTE: Centralized URL decoding with automatic detection
 * Handles both Base64 encoded URLs and regular URI-encoded URLs
 */
export const decodeHubUrl = (encodedUrl) => {
    if (!encodedUrl) {
        throw new Error('URL is required');
    }
    
    try {
        console.log('🔍 [URLDecoder] Processing encoded URL:', encodedUrl);
        
        // Check if it looks like a Base64 string
        if (encodedUrl.match(/^[A-Za-z0-9+/\-_]*={0,2}$/)) {
            // Try to decode as Base64
            console.log('🔍 [URLDecoder] Detected Base64, decoding...');
            const decoded = decodeUrl(encodedUrl);
            console.log('🔗 [URLDecoder] Base64 decoded URL:', decoded);
            return decoded;
        } else {
            // If it doesn't look like Base64, treat as URI-encoded
            console.log('🔍 [URLDecoder] Not Base64, using URI decoding...');
            const decoded = decodeURIComponent(encodedUrl);
            console.log('🔗 [URLDecoder] URI decoded URL:', decoded);
            return decoded;
        }
    } catch (error) {
        console.error('❌ [URLDecoder] Error decoding URL:', error);
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
        console.error('❌ [URLDecoder] Validation failed:', error);
        throw error;
    }
};