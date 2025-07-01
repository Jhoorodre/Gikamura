import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useItem } from '../hooks/useItem';
import { remoteStorage } from '../services/remotestorage';
import { RS_PATH } from '../services/rs/rs-config.js';
import api from '../services/api.js';
import { fetchJSONWithCache } from '../services/networkService.js';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    const [hubUrlToLoad, setHubUrlToLoad] = useState(null);
    const [isConnected, setIsConnected] = useState(remoteStorage.connected);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
    const [conflictMessage, setConflictMessage] = useState(null);
    const [lastAttemptedUrl, setLastAttemptedUrl] = useState("");
    const [pinnedItems, setPinnedItems] = useState([]);
    const [historyItems, setHistoryItems] = useState([]);
    const [savedHubs, setSavedHubs] = useState([]);

    // Carregamento do Hub com useQuery e novo serviço de rede
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
                const data = await fetchJSONWithCache(hubUrlToLoad);
                
                if (data?.hub) {
                    api.addHub(hubUrlToLoad, data.hub.title, data.hub.icon?.url);
                }
                
                return data;
            } catch (error) {
                console.error('[AppContext] Erro ao carregar hub:', error);
                throw new Error(`Falha ao carregar o hub: ${error.message}`);
            }
        },
        enabled: !!hubUrlToLoad,
        retry: (failureCount, error) => {
            // Retry automático até 3 vezes para erros recuperáveis
            if (failureCount < 3) {
                const retryableErrors = ['network', 'timeout', 'fetch'];
                return retryableErrors.some(keyword => 
                    error.message.toLowerCase().includes(keyword)
                );
            }
            return false;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponencial
        staleTime: 5 * 60 * 1000, // 5 minutos
        cacheTime: 10 * 60 * 1000, // 10 minutos
    });

    const {
        loading: itemLoading,
        error: itemError,
        selectItem,
        selectedItemData,
        clearSelectedItem
    } = useItem();

    const refreshUserData = useCallback(() => {
        if (remoteStorage.connected) {
            api.getAllPinnedSeries().then(setPinnedItems);
            api.getAllUnpinnedSeries().then(setHistoryItems);
            api.getAllHubs().then(setSavedHubs);
        }
    }, []);
    const handleChange = useCallback((event) => {
        if (event.path.startsWith(`/${RS_PATH}/`)) {
            refreshUserData();
        }
    }, [refreshUserData]);
    useEffect(() => {
        const handleConnectionChange = () => setIsConnected(remoteStorage.connected);
        const handleSyncReqDone = () => setIsSyncing(true);
        const handleSyncDone = () => setIsSyncing(false);
        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => setIsOffline(false);
        const handleConflict = (conflictEvent) => {
            setConflictMessage(
                conflictEvent && conflictEvent.path
                    ? `Conflito de dados em "${conflictEvent.path}". A versão mais recente foi aplicada para manter tudo sincronizado.`
                    : "Conflito de dados detectado. A versão mais recente foi aplicada."
            );
            setTimeout(() => setConflictMessage(null), 8000);
        };
        remoteStorage.on('connected', handleConnectionChange);
        remoteStorage.on('disconnected', handleConnectionChange);
        remoteStorage.on('sync-req-done', handleSyncReqDone);
        remoteStorage.on('sync-done', handleSyncDone);
        remoteStorage.on('conflict', handleConflict);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);
        return () => {
            remoteStorage.removeEventListener('connected', handleConnectionChange);
            remoteStorage.removeEventListener('disconnected', handleConnectionChange);
            remoteStorage.removeEventListener('sync-req-done', handleSyncReqDone);
            remoteStorage.removeEventListener('sync-done', handleSyncDone);
            remoteStorage.removeEventListener('conflict', handleConflict);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, []);
    useEffect(() => {
        if (isConnected && remoteStorage.private) {
            refreshUserData();
            remoteStorage.private.on('change', handleChange);
            return () => {
                if (remoteStorage.private) {
                    remoteStorage.private.removeEventListener('change', handleChange);
                }
            };
        }
    }, [isConnected, refreshUserData, handleChange]);

    // loadHub agora só define a URL com recuperação de erro
    const loadHub = useCallback((url) => {
        setLastAttemptedUrl(url);
        setHubUrlToLoad(url);
    }, []);

    // Função para tentar recarregar hub em caso de erro
    const retryLoadHub = useCallback(() => {
        if (lastAttemptedUrl) {
            console.log('[AppContext] Tentando recarregar hub:', lastAttemptedUrl);
            refetchHub();
        }
    }, [lastAttemptedUrl, refetchHub]);

    const togglePinStatus = useCallback(async (item) => {
        if (!item || !item.slug || !item.sourceId) return;
        try {
            if (item.pinned) {
                await api.unpinSeries(item.slug, item.sourceId);
            } else {
                await api.pinSeries(item.slug, item.sourceId);
            }
        } catch (error) {
            console.error("Falha ao alterar o estado de 'fixado':", error);
        }
    }, []);

    const value = {
        currentHubData,
        hubLoading,
        hubError: hubError ? hubError.message : null,
        isSyncing,
        conflictMessage,
        isOffline,
        lastAttemptedUrl,
        isConnected,
        loadHub,
        retryLoadHub, // Nova função para retry
        itemLoading,
        pinnedItems,
        historyItems,
        savedHubs,
        addHub: api.addHub,
        removeHub: api.removeHub,
        togglePinStatus,
        refreshUserData,
        itemError,
        selectedItemData,
        selectItem,
        clearSelectedItem,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
