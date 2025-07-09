// AIDEV-NOTE: Route guard components for parameter validation and error handling
import { useState, useEffect } from 'react';
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
  // AIDEV-NOTE: Delay validation to avoid race conditions on refresh
  const [isValidated, setIsValidated] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  
  useEffect(() => {
    const validate = () => {
      // Se parâmetros ainda não estão disponíveis e temos tentativas restantes
      const hasEmptyParams = Object.values(encodedParams).some(v => !v);
      if (hasEmptyParams && retryCount < 5) {
        if (import.meta.env?.DEV) {
          console.log(`[Base64RouteGuard] Parâmetros vazios, tentativa ${retryCount + 1}/5`);
        }
        setRetryCount(prev => prev + 1);
        return;
      }
      
      for (const [key, encodedValue] of Object.entries(encodedParams)) {
        if (!encodedValue) {
          if (import.meta.env?.DEV) {
            console.warn(`[Base64RouteGuard] Missing encoded parameter '${key}' após ${retryCount} tentativas`);
          }
          setIsValid(false);
          setIsValidated(true);
          return;
        }
        
        // Validate Base64 format
        if (!isValidBase64(encodedValue)) {
          if (import.meta.env?.DEV) {
            console.warn(`[Base64RouteGuard] Invalid Base64 parameter '${key}': ${encodedValue}`);
          }
          setIsValid(false);
          setIsValidated(true);
          return;
        }
        
        // Validate URL content if requested
        if (validateUrls && !isValidEncodedUrl(encodedValue)) {
          if (import.meta.env?.DEV) {
            console.warn(`[Base64RouteGuard] Invalid URL in encoded parameter '${key}': ${encodedValue}`);
          }
          setIsValid(false);
          setIsValidated(true);
          return;
        }
      }
      
      setIsValid(true);
      setIsValidated(true);
    };
    
    // Delay maior para garantir que parâmetros estejam prontos após refresh
    const timer = setTimeout(validate, 100);
    return () => clearTimeout(timer);
  }, [encodedParams, validateUrls, retryCount]);
  
  if (!isValidated) {
    return null; // Show nothing while validating
  }
  
  if (!isValid) {
    return <Navigate to={redirectTo} replace />;
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
  // AIDEV-NOTE: Debug reader route validation
  if (import.meta.env?.DEV) {
    console.log('📖 [ReaderRouteGuard] Validando parâmetros:', {
      encodedUrl,
      encodedChapterId,
      encodedUrlValid: encodedUrl && typeof encodedUrl === 'string',
      encodedChapterIdValid: encodedChapterId && typeof encodedChapterId === 'string'
    });
  }
  
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