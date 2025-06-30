// src/services/api.js
import { CORS_PROXY_URL } from '../constants';

const cache = new Map();

export const fetchData = async (url) => {
    if (cache.has(url)) {
        console.log("Dados carregados do cache em memória!");
        return cache.get(url);
    }

    const response = await fetch(`${CORS_PROXY_URL}${encodeURIComponent(url)}`);
    if (!response.ok) {
        throw new Error(`Falha na requisição para ${url} (status: ${response.status})`);
    }
    const data = await response.json();
    cache.set(url, data); // Salva no cache em memória
    return data;
};
