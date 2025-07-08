// AIDEV-NOTE: HubContext isola estado e lógica do hub para evitar re-renderizações globais
import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { loadHubJSON } from '../services/jsonReader.js';
import api, { clearCaches } from '../services/api.js';
import { useLocalStorage } from '../hooks/useUtils'; // AIDEV-NOTE: Persistência do último hub carregado
import { encodeUrl } from '../utils/encoding'; // AIDEV-NOTE: Import for proper Base64 URL encoding

const HubContext = createContext();

export const useHubContext = () => useContext(HubContext);

export const HubProvider = ({ children }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [hubUrlToLoad, setHubUrlToLoad] = useLocalStorage('lastHubUrl', null);
    const [lastAttemptedUrl, setLastAttemptedUrl] = useState("");

    // Carregamento do hub
    const {
        data: currentHubData,
        isLoading: hubLoading,
        error: hubError,
        refetch: refetchHub
    } = useQuery({
        queryKey: ['hub', hubUrlToLoad],
        queryFn: async () => {
            if (!hubUrlToLoad) return null;
            try {
                const data = await loadHubJSON(hubUrlToLoad);
                if (data?.hub) {
                    api.addHub(hubUrlToLoad, data.hub.title, data.hub.icon?.url);
                }
                return data;
            } catch (error) {
                throw new Error(`Falha ao carregar o hub: ${error.message}`);
            }
        },
        enabled: !!hubUrlToLoad,
        retry: false,
        retryDelay: false,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: true, // AIDEV-NOTE: Garante carregamento automático do último hub salvo
        refetchOnReconnect: false,
    });

    const loadHub = useCallback((url) => {
        if (hubUrlToLoad === url && currentHubData) {
            // Se a URL for a mesma e os dados já estiverem carregados, apenas navega
            const encodedUrl = encodeUrl(url);
            console.log('🔗 [HubContext] URL already loaded, navigating to:', url);
            console.log('🔗 [HubContext] Encoded URL:', encodedUrl);
            navigate(`/hub/${encodedUrl}`);
            return Promise.resolve(true);
        }
        setLastAttemptedUrl(url);
        setHubUrlToLoad(url); // Salva no localStorage e dispara o carregamento
        return Promise.resolve(true);
    }, [hubUrlToLoad, currentHubData, navigate, setHubUrlToLoad]);

    const retryLoadHub = useCallback(() => {
        if (lastAttemptedUrl) refetchHub();
    }, [lastAttemptedUrl, refetchHub]);

    const clearHubData = useCallback(() => {
        queryClient.removeQueries({ queryKey: ['hub'], exact: true });
        setHubUrlToLoad(null); // Limpa o estado e o localStorage
        setLastAttemptedUrl("");
        navigate('/'); // Volta para a página inicial
    }, [queryClient, setHubUrlToLoad, navigate]);

    // AIDEV-NOTE: Memoize context value to prevent unnecessary re-renders
    const value = useMemo(() => ({
        currentHubData,
        currentHubUrl: hubUrlToLoad,
        lastAttemptedUrl,
        hubLoading,
        hubError: hubError ? hubError.message : null,
        loadHub,
        retryLoadHub,
        clearHubData,
    }), [
        currentHubData,
        hubUrlToLoad,
        lastAttemptedUrl,
        hubLoading,
        hubError,
        loadHub,
        retryLoadHub,
        clearHubData
    ]);

    return (
        <HubContext.Provider value={value}>
            {children}
        </HubContext.Provider>
    );
}; 