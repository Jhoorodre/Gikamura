// AIDEV-NOTE: HubContext isola estado e lógica do hub para evitar re-renderizações globais
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { loadHubJSON } from '../services/jsonReader.js';
import api, { clearCaches } from '../services/api.js';

const HubContext = createContext();

export const useHubContext = () => useContext(HubContext);

export const HubProvider = ({ children }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [hubUrlToLoad, setHubUrlToLoad] = useState(null);
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
        refetchOnMount: false,
        refetchOnReconnect: false,
    });

    const loadHub = useCallback((url) => {
        if (hubUrlToLoad === url) return Promise.resolve(true);
        setLastAttemptedUrl(url);
        setHubUrlToLoad(url);
        return Promise.resolve(true);
    }, [hubUrlToLoad]);

    const retryLoadHub = useCallback(() => {
        if (lastAttemptedUrl) refetchHub();
    }, [lastAttemptedUrl, refetchHub]);

    const clearHubData = useCallback(() => {
        queryClient.removeQueries(['hub']);
        setHubUrlToLoad(null);
        setLastAttemptedUrl("");
    }, [queryClient]);

    const value = {
        currentHubData,
        currentHubUrl: hubUrlToLoad,
        lastAttemptedUrl,
        hubLoading,
        hubError: hubError ? hubError.message : null,
        loadHub,
        retryLoadHub,
        clearHubData,
    };

    return (
        <HubContext.Provider value={value}>
            {children}
        </HubContext.Provider>
    );
}; 