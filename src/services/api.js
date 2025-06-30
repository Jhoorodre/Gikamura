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
            let errorMessage;
            switch (response.status) {
                case 404:
                    errorMessage = "O recurso solicitado não foi encontrado (Erro 404).";
                    break;
                case 500:
                    errorMessage = "Ocorreu um erro no servidor (Erro 500). Tente novamente mais tarde.";
                    break;
                default:
                    errorMessage = `Erro ao carregar os dados. Status: ${response.status}.`;
            }
            const error = new Error(errorMessage);
            error.status = response.status;
            throw error;
        }
        const data = await response.json();
        memoryCache.set(url, data);
        try {
            storageCache.setItem(cacheKey, JSON.stringify(data));
        } catch (e) {
            console.warn("Não foi possível salvar no sessionStorage. O cache pode estar cheio.");
        }
        return data;
    } catch (error) {
        if (error instanceof SyntaxError) {
            console.error("Falha ao analisar JSON:", error);
            throw new Error("A resposta do servidor não é um JSON válido. Verifique a URL do hub.");
        }
        throw error;
    }
};
