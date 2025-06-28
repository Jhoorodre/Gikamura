import { useState } from 'react';
import { CORS_PROXY_URL } from '../constants';

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
