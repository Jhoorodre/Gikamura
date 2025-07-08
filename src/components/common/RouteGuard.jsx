// AIDEV-NOTE: Route guard components for parameter validation and error handling
import { Navigate } from 'react-router-dom';
import { isValidBase64, isValidEncodedUrl } from '../../utils/encoding';

/**
 * AIDEV-NOTE: Generic route guard that validates required parameters
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if valid
 * @param {Object} props.params - Route parameters to validate
 * @param {string} props.redirectTo - Where to redirect if invalid (default: '/')
 * @param {Function} props.validator - Custom validation function
 */
export const RouteGuard = ({ 
  children, 
  params = {}, 
  redirectTo = '/', 
  validator = null 
}) => {
  // Custom validator takes precedence
  if (validator && !validator(params)) {
    if (import.meta.env?.DEV) {
      console.warn('[RouteGuard] Custom validation failed, redirecting to:', redirectTo);
    }
    return <Navigate to={redirectTo} replace />;
  }
  
  // Default parameter validation
  for (const [key, value] of Object.entries(params)) {
    if (!value || typeof value !== 'string') {
      if (import.meta.env?.DEV) {
        console.warn(`[RouteGuard] Missing or invalid parameter '${key}', redirecting to:`, redirectTo);
      }
      return <Navigate to={redirectTo} replace />;
    }
  }
  
  return children;
};

/**
 * AIDEV-NOTE: Route guard specifically for Base64 encoded parameters
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if valid
 * @param {Object} props.encodedParams - Base64 encoded parameters to validate
 * @param {string} props.redirectTo - Where to redirect if invalid (default: '/')
 * @param {boolean} props.validateUrls - Whether to validate that encoded params are URLs
 */
export const Base64RouteGuard = ({ 
  children, 
  encodedParams = {}, 
  redirectTo = '/', 
  validateUrls = true 
}) => {
  for (const [key, encodedValue] of Object.entries(encodedParams)) {
    if (!encodedValue) {
      if (import.meta.env?.DEV) {
        console.warn(`[Base64RouteGuard] Missing encoded parameter '${key}', redirecting to:`, redirectTo);
      }
      return <Navigate to={redirectTo} replace />;
    }
    
    // Validate Base64 format
    if (!isValidBase64(encodedValue)) {
      if (import.meta.env?.DEV) {
        console.warn(`[Base64RouteGuard] Invalid Base64 parameter '${key}': ${encodedValue}, redirecting to:`, redirectTo);
      }
      return <Navigate to={redirectTo} replace />;
    }
    
    // Validate URL content if requested
    if (validateUrls && !isValidEncodedUrl(encodedValue)) {
      if (import.meta.env?.DEV) {
        console.warn(`[Base64RouteGuard] Invalid URL in encoded parameter '${key}': ${encodedValue}, redirecting to:`, redirectTo);
      }
      return <Navigate to={redirectTo} replace />;
    }
  }
  
  return children;
};

/**
 * AIDEV-NOTE: Route guard for hub routes that require encoded URL validation
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if valid
 * @param {string} props.encodedUrl - Base64 encoded URL parameter
 */
export const HubRouteGuard = ({ children, encodedUrl }) => {
  return (
    <Base64RouteGuard
      encodedParams={{ encodedUrl }}
      redirectTo="/"
      validateUrls={true}
    >
      {children}
    </Base64RouteGuard>
  );
};

/**
 * AIDEV-NOTE: Route guard for manga routes that require encoded URL validation
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if valid
 * @param {string} props.encodedUrl - Base64 encoded URL parameter
 */
export const MangaRouteGuard = ({ children, encodedUrl }) => {
  return (
    <Base64RouteGuard
      encodedParams={{ encodedUrl }}
      redirectTo="/"
      validateUrls={true}
    >
      {children}
    </Base64RouteGuard>
  );
};

/**
 * AIDEV-NOTE: Route guard for reader routes that require both URL and chapter ID validation
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if valid
 * @param {string} props.encodedUrl - Base64 encoded URL parameter
 * @param {string} props.encodedChapterId - Base64 encoded chapter ID parameter
 */
export const ReaderRouteGuard = ({ children, encodedUrl, encodedChapterId }) => {
  return (
    <Base64RouteGuard
      encodedParams={{ encodedUrl, encodedChapterId }}
      redirectTo="/"
      validateUrls={false} // Chapter IDs are not URLs
    >
      {children}
    </Base64RouteGuard>
  );
};