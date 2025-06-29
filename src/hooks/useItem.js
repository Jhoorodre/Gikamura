import { useState } from 'react';
import { CORS_PROXY_URL } from '../constants';

// Função simples de validação dos dados do item
const validateItemData = (data) => {
    if (!data || typeof data !== 'object') {
        throw new Error("Os dados do item não são um objeto válido.");
    }
    if (!data.title || typeof data.title !== 'string') {
        throw new Error("A propriedade 'title' está ausente ou não é uma string.");
    }
    if (!data.chapters || typeof data.chapters !== 'object') {
        throw new Error("A propriedade 'chapters' está ausente ou não é um objeto.");
    }
    // Adicione mais validações conforme necessário
    return true;
};

export const useItem = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchItemData = async (itemObject) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${CORS_PROXY_URL}${encodeURIComponent(itemObject.data.url)}`);
            if (!response.ok) {
                throw new Error(`Não foi possível carregar os dados do item (status: ${response.status})`);
            }
            const data = await response.json();
            // Validação dos dados recebidos
            validateItemData(data);
            return { ...itemObject, entries: data.chapters }; // chapters -> entries
        } catch (err) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, fetchItemData };
};
