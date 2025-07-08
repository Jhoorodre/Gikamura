// AIDEV-NOTE: Custom hook for standardized route error handling
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleError } from '../utils/errorHandler';

/**
 * AIDEV-NOTE: Standardized route error handling hook
 */
export const useRouteError = (options = {}) => {
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    
    const {
        redirectOnError = false,
        redirectPath = '/',
        showNotification = true,
        retryable = true
    } = options;

    /**
     * Handle route-level errors with consistent behavior
     */
    const handleRouteError = useCallback((error, context = {}) => {
        const errorInfo = handleError(error, {
            ...context,
            route: window.location.pathname,
            timestamp: Date.now()
        });
        
        setError(errorInfo);
        setIsLoading(false);
        
        // Optional automatic redirect on error
        if (redirectOnError) {
            setTimeout(() => {
                navigate(redirectPath, { replace: true });
            }, 3000);
        }
        
        return errorInfo;
    }, [redirectOnError, redirectPath, navigate]);

    /**
     * Clear current error
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    /**
     * Retry the failed operation
     */
    const retry = useCallback(async (operation) => {
        if (!retryable || !operation) {
            return;
        }
        
        setError(null);
        setIsLoading(true);
        
        try {
            const result = await operation();
            setIsLoading(false);
            return result;
        } catch (error) {
            handleRouteError(error, { operation: 'retry' });
            throw error;
        }
    }, [retryable, handleRouteError]);

    /**
     * Safe async operation wrapper
     */
    const safeAsyncOperation = useCallback(async (operation, context = {}) => {
        setError(null);
        setIsLoading(true);
        
        try {
            const result = await operation();
            setIsLoading(false);
            return result;
        } catch (error) {
            handleRouteError(error, context);
            throw error;
        }
    }, [handleRouteError]);

    /**
     * Navigate with error handling
     */
    const safeNavigate = useCallback((path, options = {}) => {
        try {
            navigate(path, options);
        } catch (error) {
            handleRouteError(error, { operation: 'navigation', targetPath: path });
        }
    }, [navigate, handleRouteError]);

    return {
        error,
        isLoading,
        hasError: Boolean(error),
        canRetry: retryable && error?.canRetry,
        handleRouteError,
        clearError,
        retry,
        safeAsyncOperation,
        safeNavigate
    };
};

/**
 * AIDEV-NOTE: Hook for handling URL parameter errors
 */
export const useRouteParams = (paramValidator) => {
    const [paramError, setParamError] = useState(null);
    const navigate = useNavigate();

    const validateParams = useCallback((params) => {
        try {
            if (paramValidator) {
                const isValid = paramValidator(params);
                if (!isValid) {
                    throw new Error('Invalid route parameters');
                }
            }
            
            setParamError(null);
            return true;
        } catch (error) {
            const errorInfo = handleError(error, {
                operation: 'parameter_validation',
                params,
                route: window.location.pathname
            });
            
            setParamError(errorInfo);
            
            // Redirect to home on parameter validation failure
            setTimeout(() => {
                navigate('/', { replace: true });
            }, 2000);
            
            return false;
        }
    }, [paramValidator, navigate]);

    return {
        paramError,
        hasParamError: Boolean(paramError),
        validateParams,
        clearParamError: () => setParamError(null)
    };
};