import { useState } from 'react';
import { CORS_PROXY_URL } from '../constants';

export const useManga = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchMangaData = async (mangaObject) => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${CORS_PROXY_URL}${encodeURIComponent(mangaObject.data.url)}`);
            if (!response.ok) {
                throw new Error(`Não foi possível carregar os capítulos do mangá (status: ${response.status})`);
            }
            const chaptersData = await response.json();
            return {
                ...mangaObject,
                chapters: chaptersData.chapters
            };
        } catch (err) {
            console.error(err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, fetchMangaData };
};
