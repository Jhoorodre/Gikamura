import { CORS_PROXY_URL } from '../constants';

const memoryCache = new Map();
const storageCache = sessionStorage;
const CACHE_PREFIX = 'fetch-cache:';
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutos em milissegundos

const getCacheKey = (url) => `${CACHE_PREFIX}${url}`;

/**
 * Verifica se um item de cache é inválido (não existe ou expirou).
 * @param {object} cachedItem - O item do cache, que deve ter uma propriedade 'expiry'.
 * @returns {boolean} - True se o item for inválido, false caso contrário.
 */
const isCacheInvalid = (cachedItem) => {
    return !cachedItem || !cachedItem.expiry || Date.now() > cachedItem.expiry;
};

export const fetchData = async (url, options = {}) => {
    const { ttl = DEFAULT_CACHE_TTL } = options;
    const cacheKey = getCacheKey(url);

    // 1. Tenta o cache em memória
    const memoryItem = memoryCache.get(url);
    if (!isCacheInvalid(memoryItem)) {
        console.log("Dados carregados do cache em memória!");
        return memoryItem.data;
    }

    // 2. Tenta o sessionStorage
    const sessionItemRaw = storageCache.getItem(cacheKey);
    if (sessionItemRaw) {
        const sessionItem = JSON.parse(sessionItemRaw);
        if (!isCacheInvalid(sessionItem)) {
            console.log("Dados carregados do sessionStorage!");
            memoryCache.set(url, sessionItem); // Reaquece o cache em memória para acesso rápido
            return sessionItem.data;
        }
    }

    // 3. Busca na rede
    try {
        const response = await fetch(`${CORS_PROXY_URL}${encodeURIComponent(url)}`);
        if (!response.ok) {
            const error = new Error(`Erro ao carregar os dados. Status: ${response.status}.`);
            error.status = response.status;
            throw error;
        }
        const data = await response.json();

        // Cria o objeto de cache com os dados e o tempo de expiração
        const cacheItem = {
            data: data,
            expiry: Date.now() + ttl,
        };

        memoryCache.set(url, cacheItem);
        try {
            storageCache.setItem(cacheKey, JSON.stringify(cacheItem));
        } catch (e) {
            console.warn("Não foi possível salvar no sessionStorage. O cache pode estar cheio.");
            // Opcional: Implementar uma estratégia de limpeza de cache antigo aqui.
        }
        return cacheItem.data;
    } catch (error) {
        if (error instanceof SyntaxError) {
            console.error("Falha ao analisar JSON:", error);
            throw new Error("A resposta do servidor não é um JSON válido. Verifique a URL do hub.");
        }
        // Re-lança o erro para que a camada superior possa tratá-lo (ex: exibir na UI)
        throw error;
    }
};