import { useState, useEffect } from 'react';

/**
 * Serviço de rede robusto com retry automático e recuperação de falhas
 * Remove a dependência de proxies CORS fazendo requests diretos
 */

// Configurações de retry
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 segundo
  maxDelay: 10000, // 10 segundos
  backoffMultiplier: 2
};

// Lista de fallback URLs para casos críticos
const FALLBACK_PROXIES = [
  '', // Request direto primeiro
  'https://corsproxy.io/?', // Proxy principal recomendado
  'https://api.allorigins.win/get?url=',
  'https://cors-anywhere.herokuapp.com/'
];

/**
 * Utilitário para aguardar um tempo específico
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calcula o tempo de espera para retry com backoff exponencial
 */
const calculateRetryDelay = (attempt) => {
  const delay = RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
};

/**
 * Verifica se um erro é recuperável (vale a pena tentar novamente)
 */
const isRetryableError = (error) => {
  // Erros de rede são recuperáveis
  if (!navigator.onLine) return false; // Não tentar se offline
  
  // Status codes que vale a pena tentar novamente
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  
  if (error.status) {
    return retryableStatusCodes.includes(error.status);
  }
  
  // Erros de rede/timeout são recuperáveis
  if (error.name === 'TypeError' || error.message.includes('fetch')) {
    return true;
  }
  
  return false;
};

/**
 * Tenta fazer uma requisição com uma URL específica
 */
const attemptFetch = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 15000);
  
  try {
    // Para requests GET simples, não enviar cabeçalhos desnecessários que causam CORS
    const fetchOptions = {
      ...options,
      signal: controller.signal
    };
    
    // Só adicionar cabeçalhos se realmente necessário
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
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Tenta múltiplos proxies se necessário
 */
const fetchWithFallbacks = async (originalUrl, options = {}) => {
  let lastError;
  
  for (const proxy of FALLBACK_PROXIES) {
    try {
      const url = proxy ? `${proxy}${encodeURIComponent(originalUrl)}` : originalUrl;
      const response = await attemptFetch(url, options);
      
      // Se chegou aqui, deu certo
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
 * Verifica se uma URL é acessível
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
 * Cache em memória para evitar requisições desnecessárias
 */
const responseCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const fetchJSONWithCache = async (url, options = {}) => {
  const cacheKey = `${url}:${JSON.stringify(options)}`;
  const cached = responseCache.get(cacheKey);
  
  // Verifica se existe cache válido
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log(`[NetworkService] Cache hit para: ${url}`);
    return cached.data;
  }
  
  try {
    const data = await fetchJSON(url, options);
    
    // Armazena no cache
    responseCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  } catch (error) {
    // Se tem cache expirado, usa ele como fallback
    if (cached) {
      console.warn(`[NetworkService] Usando cache expirado como fallback para: ${url}`);
      return cached.data;
    }
    
    throw error;
  }
};

/**
 * Limpa o cache manualmente
 */
export const clearNetworkCache = () => {
  responseCache.clear();
  console.log('[NetworkService] Cache limpo');
};

// Hook para verificar status da rede
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
