// AIDEV-NOTE: Robust network service with auto-retry, fallback proxies, and error recovery
import { useState, useEffect } from 'react';

/**
 * Serviço de rede robusto com retry automático e recuperação de falhas
 * Remove a dependência de proxies CORS fazendo requests diretos
 * AIDEV-NOTE: Handles retries, fallback proxies and error recovery for network requests
 */

// AIDEV-NOTE: Retry configuration with exponential backoff
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

// AIDEV-NOTE: Fallback proxy URLs for CORS issues (direct first, then fallbacks)
const FALLBACK_PROXIES = [
  '', // Direct request first
  'https://corsproxy.io/?', // Main recommended proxy
  'https://api.allorigins.win/get?url=',
  'https://cors-anywhere.herokuapp.com/'
];

/**
 * AIDEV-NOTE: Utility for delay in retry backoff logic
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * AIDEV-NOTE: Calculates retry delay with exponential backoff
 */
const calculateRetryDelay = (attempt) => {
  const delay = RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
};

/**
 * AIDEV-NOTE: Determines if error is recoverable (worth retrying)
 * AIDEV-TODO: Expand error types for retry logic if needed
 */
const isRetryableError = (error) => {
  // AIDEV-NOTE: Network errors are recoverable
  if (!navigator.onLine) return false; // Don't retry if offline
  
  // AIDEV-NOTE: Status codes worth retrying
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  
  if (error.status) {
    return retryableStatusCodes.includes(error.status);
  }
  
  // AIDEV-NOTE: Network/timeout errors are recoverable
  if (error.name === 'TypeError' || error.message.includes('fetch')) {
    return true;
  }
  
  return false;
};

/**
 * AIDEV-NOTE: Attempts fetch with specific URL and timeout control
 * Returns both response and controller for external cancellation
 */
const attemptFetch = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 15000);
  
  try {
    // AIDEV-NOTE: For simple GET requests, don't send unnecessary headers that cause CORS
    const fetchOptions = {
      ...options,
      signal: controller.signal
    };
    
    // AIDEV-NOTE: Only add headers if really necessary
    if (options.headers || (options.method && options.method !== 'GET')) {
      fetchOptions.headers = {
        'Accept': 'application/json',
        ...(options.method && options.method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers
      };
    }
    
    const response = await fetch(url, fetchOptions);
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return { response, controller };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Tenta múltiplos proxies se necessário
 * AIDEV-NOTE: Updated to handle new attemptFetch return format
 */
const fetchWithFallbacks = async (originalUrl, options = {}) => {
  let lastError;
  
  for (const proxy of FALLBACK_PROXIES) {
    try {
      const url = proxy ? `${proxy}${encodeURIComponent(originalUrl)}` : originalUrl;
      const { response, controller } = await attemptFetch(url, options);
      
      // Se chegou aqui, deu certo - return just the response for backward compatibility
      return response;
    } catch (error) {
      lastError = error;
      console.warn(`[NetworkService] Falha com ${proxy || 'request direto'}:`, error.message);
      
      // Se for CORS, tenta próximo proxy
      if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
        continue;
      }
      
      // Se for erro de rede, pode ser temporário
      if (isRetryableError(error)) {
        continue;
      }
      
      // Se for erro crítico, para aqui
      break;
    }
  }
  
  throw lastError;
};

/**
 * Versão cancelável que retorna controller para cancelamento externo
 * AIDEV-NOTE: Simplified cancellable fetch with external signal support
 */
export const cancellableFetch = async (url, options = {}) => {
  const controller = new AbortController();
  
  // Combine external signal with internal signal if provided
  if (options.signal) {
    const combinedSignal = AbortSignal.any ? 
      AbortSignal.any([controller.signal, options.signal]) :
      controller.signal; // Fallback for older browsers
    options = { ...options, signal: combinedSignal };
  } else {
    options = { ...options, signal: controller.signal };
  }
  
  try {
    const response = await robustFetch(url, options);
    return {
      response,
      cancel: () => controller.abort(),
      controller
    };
  } catch (error) {
    // Ensure controller is aborted on error
    controller.abort();
    throw error;
  }
};

/**
 * Requisição principal com retry automático e fallbacks
 */
export const robustFetch = async (url, options = {}) => {
  let attempt = 0;
  let lastError;
  
  while (attempt <= RETRY_CONFIG.maxRetries) {
    try {
      const response = await fetchWithFallbacks(url, options);
      
      // Log de sucesso se houve tentativas anteriores
      if (attempt > 0) {
        console.log(`[NetworkService] Sucesso após ${attempt} tentativas para: ${url}`);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      attempt++;
      
      // Se não vale a pena tentar novamente, para aqui
      if (!isRetryableError(error) || attempt > RETRY_CONFIG.maxRetries) {
        break;
      }
      
      // Aguarda antes da próxima tentativa
      const retryDelay = calculateRetryDelay(attempt - 1);
      console.warn(`[NetworkService] Tentativa ${attempt} falhou. Tentando novamente em ${retryDelay}ms:`, error.message);
      
      await delay(retryDelay);
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  console.error(`[NetworkService] Todas as tentativas falharam para: ${url}`, lastError);
  throw new Error(`Falha na requisição após ${RETRY_CONFIG.maxRetries} tentativas: ${lastError.message}`);
};

/**
 * Processa resposta de diferentes tipos de proxy
 */
const processProxyResponse = async (response, proxyUrl) => {
  const data = await response.json();
  
  // Para allorigins.win, os dados vêm dentro de data.contents
  if (proxyUrl.includes('allorigins.win')) {
    if (data.contents) {
      return JSON.parse(data.contents);
    }
  }
  
  // Para outros proxies e requests diretos, retorna os dados como estão
  return data;
};

/**
 * Função específica para carregar JSON com validação
 */
export const fetchJSON = async (url, options = {}) => {
  try {
    const response = await robustFetch(url, options);
    
    // Detecta qual proxy foi usado baseado na URL final
    const finalUrl = response.url || url;
    let data;
    
    if (finalUrl.includes('allorigins.win') || 
        finalUrl.includes('corsproxy.io') || 
        finalUrl.includes('cors-anywhere')) {
      data = await processProxyResponse(response, finalUrl);
    } else {
      data = await response.json();
    }
    
    // Validação básica do JSON
    if (!data || typeof data !== 'object') {
      throw new Error('JSON inválido recebido');
    }
    
    return data;
  } catch (error) {
    // Fallback para dados locais se for uma URL externa que falha por CORS
    if (url.includes('cdn.jsdelivr.net') && url.includes('Tower_of_God')) {
      console.warn('🔄 [NetworkService] Usando dados locais devido a erro CORS:', error.message);
      try {
        const localResponse = await fetch('/raw/reader.json');
        if (localResponse.ok) {
          return await localResponse.json();
        }
      } catch (localError) {
        console.error('❌ [NetworkService] Falha ao carregar dados locais:', localError);
      }
    }
    
    if (error.message.includes('JSON')) {
      throw new Error(`Erro ao processar JSON de ${url}: ${error.message}`);
    }
    throw error;
  }
};

/**
 * AIDEV-NOTE: Checks if URL is accessible with health monitoring
 */
export const checkURLHealth = async (url) => {
  try {
    const response = await robustFetch(url, { 
      method: 'HEAD',
      timeout: 5000 
    });
    return { 
      accessible: true, 
      status: response.status,
      responseTime: Date.now() 
    };
  } catch (error) {
    return { 
      accessible: false, 
      error: error.message,
      responseTime: Date.now() 
    };
  }
};

/**
 * AIDEV-NOTE: In-memory cache to avoid unnecessary requests
 */
const responseCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // AIDEV-NOTE: 5 minutes cache duration

export const fetchJSONWithCache = async (url, options = {}) => {
  const cacheKey = `${url}:${JSON.stringify(options)}`;
  const cached = responseCache.get(cacheKey);
  
  // AIDEV-NOTE: Check if valid cache exists
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log(`[NetworkService] Cache hit para: ${url}`);
    return cached.data;
  }
  
  try {
    const data = await fetchJSON(url, options);
    
    // AIDEV-NOTE: Store in cache with timestamp
    responseCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  } catch (error) {
    // AIDEV-NOTE: Use expired cache as fallback if available
    if (cached) {
      console.warn(`[NetworkService] Usando cache expirado como fallback para: ${url}`);
      return cached.data;
    }
    
    throw error;
  }
};

/**
 * AIDEV-NOTE: Manual cache clearing utility
 */
export const clearNetworkCache = () => {
  responseCache.clear();
  console.log('[NetworkService] Cache limpo');
};

// AIDEV-NOTE: Hook for network status monitoring with timestamps
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastOnline, setLastOnline] = useState(Date.now());
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(Date.now());
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return { isOnline, lastOnline };
};
