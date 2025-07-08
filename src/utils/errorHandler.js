// AIDEV-NOTE: Centralized error handling utility for consistent error management
export class AppError extends Error {
    constructor(message, type = 'general', context = {}) {
        super(message);
        this.name = 'AppError';
        this.type = type;
        this.context = context;
        this.timestamp = Date.now();
    }
}

// AIDEV-NOTE: Error types for categorization
export const ERROR_TYPES = {
    NETWORK: 'network',
    VALIDATION: 'validation',
    STORAGE: 'storage',
    AUTHENTICATION: 'authentication',
    NOT_FOUND: 'not_found',
    PERMISSION: 'permission',
    GENERAL: 'general'
};

/**
 * AIDEV-NOTE: Standardized error handler with user-friendly messages
 */
export const handleError = (error, context = {}) => {
    const isDev = import.meta.env?.DEV;
    
    // Log full error details in development
    if (isDev) {
        console.group('🔴 [ErrorHandler] Error Details');
        console.error('Error:', error);
        console.log('Context:', context);
        console.log('Stack:', error.stack);
        console.groupEnd();
    } else {
        // Production logging (minimal)
        console.error('[ErrorHandler]', error.message, context);
    }
    
    // Return standardized error info
    return {
        message: getUserFriendlyMessage(error),
        type: getErrorType(error),
        canRetry: isRetryableError(error),
        context,
        timestamp: Date.now()
    };
};

/**
 * AIDEV-NOTE: Convert technical errors to user-friendly messages
 */
const getUserFriendlyMessage = (error) => {
    if (error instanceof AppError) {
        return error.message;
    }
    
    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return 'Erro de conexão. Verifique sua internet e tente novamente.';
    }
    
    if (error.name === 'AbortError') {
        return 'Operação cancelada.';
    }
    
    // HTTP errors
    if (error.message.includes('HTTP 404')) {
        return 'Conteúdo não encontrado.';
    }
    
    if (error.message.includes('HTTP 403')) {
        return 'Acesso negado.';
    }
    
    if (error.message.includes('HTTP 500')) {
        return 'Erro no servidor. Tente novamente em alguns minutos.';
    }
    
    // CORS errors
    if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
        return 'Erro de acesso. O conteúdo pode não estar disponível.';
    }
    
    // Validation errors
    if (error.message.includes('required field') || error.message.includes('invalid format')) {
        return 'Dados inválidos. Verifique as informações e tente novamente.';
    }
    
    // Storage errors
    if (error.message.includes('storage') || error.message.includes('quota')) {
        return 'Erro de armazenamento. Verifique se há espaço disponível.';
    }
    
    // Default message
    return 'Ocorreu um erro inesperado. Tente novamente.';
};

/**
 * AIDEV-NOTE: Categorize error type for proper handling
 */
const getErrorType = (error) => {
    if (error instanceof AppError) {
        return error.type;
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return ERROR_TYPES.NETWORK;
    }
    
    if (error.message.includes('HTTP 404')) {
        return ERROR_TYPES.NOT_FOUND;
    }
    
    if (error.message.includes('HTTP 403')) {
        return ERROR_TYPES.PERMISSION;
    }
    
    if (error.message.includes('validation') || error.message.includes('invalid')) {
        return ERROR_TYPES.VALIDATION;
    }
    
    if (error.message.includes('storage') || error.message.includes('quota')) {
        return ERROR_TYPES.STORAGE;
    }
    
    return ERROR_TYPES.GENERAL;
};

/**
 * AIDEV-NOTE: Determine if error is retryable
 */
const isRetryableError = (error) => {
    // Don't retry user errors
    if (error.message.includes('HTTP 400') || 
        error.message.includes('HTTP 401') || 
        error.message.includes('HTTP 403') || 
        error.message.includes('HTTP 404')) {
        return false;
    }
    
    // Don't retry aborted requests
    if (error.name === 'AbortError') {
        return false;
    }
    
    // Don't retry validation errors
    if (getErrorType(error) === ERROR_TYPES.VALIDATION) {
        return false;
    }
    
    // Retry network and server errors
    return true;
};

/**
 * AIDEV-NOTE: Async operation wrapper with standardized error handling
 */
export const withErrorHandling = async (operation, context = {}) => {
    try {
        const result = await operation();
        return { success: true, data: result };
    } catch (error) {
        const errorInfo = handleError(error, context);
        return { success: false, error: errorInfo };
    }
};

/**
 * AIDEV-NOTE: React component error boundary helper
 */
export const createErrorBoundaryInfo = (error, errorInfo) => {
    return {
        error: handleError(error, { componentStack: errorInfo.componentStack }),
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
    };
};

/**
 * AIDEV-NOTE: Format error for logging/debugging
 */
export const formatErrorForLogging = (error, context = {}) => {
    const errorInfo = {
        message: error.message,
        name: error.name,
        stack: error.stack,
        type: getErrorType(error),
        context,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
    };
    
    return errorInfo;
};