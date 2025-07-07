/**
 * Hook para carregamento e gerenciamento do hub
 * AIDEV-NOTE: Centralized hub loading with state management and navigation
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { encodeUrl } from '../utils/encoding';

// AIDEV-NOTE: Hook simplificado - apenas navega para a rota do hub
export const useHubLoader = (defaultUrl = "") => {
    const [url, setUrl] = useState(defaultUrl);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const loadHub = useCallback(async (hubUrl = url) => {
        const targetUrl = (hubUrl || url).trim();
        if (!targetUrl) {
            setError('URL é obrigatória');
            return false;
        }
        setError('');
        setLoading(true);
        try {
            const encodedHubUrl = encodeUrl(targetUrl);
            console.log('🔗 [useHubLoader] Original URL:', targetUrl);
            console.log('🔗 [useHubLoader] Encoded URL:', encodedHubUrl);
            navigate(`/hub/${encodedHubUrl}`);
            setLoading(false);
            return true;
        } catch (error) {
            setError(`URL inválida: ${error.message}`);
            setLoading(false);
            return false;
        }
    }, [url, navigate]);

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        loadHub();
    }, [loadHub]);

    const resetError = useCallback(() => {
        setError('');
    }, []);

    return {
        url,
        setUrl,
        loading,
        error,
        handleSubmit,
        loadHub,
        resetError
    };
};
