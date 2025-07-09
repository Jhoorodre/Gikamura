// AIDEV-NOTE: URL sanitization utility to prevent XSS attacks
/**
 * Sanitize and validate URLs to prevent XSS attacks
 */

/**
 * List of allowed protocols
 */
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/**
 * Dangerous patterns that should be blocked
 */
const DANGEROUS_PATTERNS = [
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /onclick=/i,
    /<script/i,
    /base64/i
];

/**
 * Sanitize a URL to prevent XSS attacks
 * @param {string} url - The URL to sanitize
 * @returns {string} - Sanitized URL or empty string if invalid
 */
export const sanitizeUrl = (url) => {
    if (!url || typeof url !== 'string') {
        return '';
    }

    // Trim whitespace
    const trimmedUrl = url.trim();

    // Check for dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(trimmedUrl)) {
            console.warn('⚠️ [Security] Blocked dangerous URL pattern:', pattern);
            return '';
        }
    }

    try {
        // Parse URL to validate structure
        const urlObj = new URL(trimmedUrl);
        
        // Check protocol
        if (!ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
            console.warn('⚠️ [Security] Blocked disallowed protocol:', urlObj.protocol);
            return '';
        }

        // Return the normalized URL
        return urlObj.toString();
    } catch (error) {
        // If URL parsing fails, it might be a relative URL
        // Only allow relative URLs that start with / or ./
        if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('./')) {
            // Additional check for dangerous content in relative URLs
            for (const pattern of DANGEROUS_PATTERNS) {
                if (pattern.test(trimmedUrl)) {
                    console.warn('⚠️ [Security] Blocked dangerous pattern in relative URL');
                    return '';
                }
            }
            return trimmedUrl;
        }

        console.warn('⚠️ [Security] Invalid URL format:', error.message);
        return '';
    }
};

/**
 * Sanitize HTML content to prevent XSS
 * @param {string} html - HTML content to sanitize
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHtml = (html) => {
    if (!html || typeof html !== 'string') {
        return '';
    }

    // Basic HTML entities encoding
    return html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

/**
 * Validate if a URL is safe to use
 * @param {string} url - URL to validate
 * @returns {boolean} - True if URL is safe
 */
export const isUrlSafe = (url) => {
    const sanitized = sanitizeUrl(url);
    return sanitized !== '' && sanitized === url;
};

export default {
    sanitizeUrl,
    sanitizeHtml,
    isUrlSafe
};
