// src/services/api.js
import { CORS_PROXY_URL } from '../constants';

const memoryCache = new Map();
const storageCache = sessionStorage;
const getCacheKey = (url) => `fetch-cache:${url}`;

export const fetchData = async (url) => {
    // 1. Tenta o cache em memória
    if (memoryCache.has(url)) {
        console.log("Dados carregados do cache em memória!");
        return memoryCache.get(url);
    }
    // 2. Tenta o sessionStorage
    const cacheKey = getCacheKey(url);
    const cachedData = storageCache.getItem(cacheKey);
    if (cachedData) {
        console.log("Dados carregados do sessionStorage!");
        const data = JSON.parse(cachedData);
        memoryCache.set(url, data);
        return data;
    }
    // 3. Busca na rede
    try {
        const response = await fetch(`${CORS_PROXY_URL}${encodeURIComponent(url)}`);
        if (!response.ok) {
            const error = new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
            error.status = response.status;
            throw error;
        }
        const data = await response.json();
        memoryCache.set(url, data);
        try {
            storageCache.setItem(cacheKey, JSON.stringify(data));
        } catch (e) {
            console.warn("Não foi possível salvar no sessionStorage. Cache pode estar cheio.");
        }
        return data;
    } catch (error) {
        if (error instanceof SyntaxError) {
            console.error("Falha ao analisar JSON:", error);
            throw new Error("A resposta recebida não é um JSON válido.");
        }
        throw error;
    }
};
