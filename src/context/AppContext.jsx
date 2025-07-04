// AIDEV-NOTE: App state management; hub loading, user data, and RemoteStorage integration
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useItem } from '../hooks/useItem';
import { remoteStorage } from '../services/remotestorage';
import { RS_PATH } from '../services/rs/rs-config.js';
import api from '../services/api.js';
import { loadHubJSON } from '../services/jsonReader.js';
import { encodeUrl } from '../utils/encoding';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [hubUrlToLoad, setHubUrlToLoad] = useState(null);
    const [isConnected, setIsConnected] = useState(remoteStorage.connected);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
    const [conflictMessage, setConflictMessage] = useState(null);
    const [lastAttemptedUrl, setLastAttemptedUrl] = useState("");
    const [pinnedItems, setPinnedItems] = useState([]);
    const [historyItems, setHistoryItems] = useState([]);
    const [savedHubs, setSavedHubs] = useState([]);
    const [hasRedirectedToHub, setHasRedirectedToHub] = useState(false); // AIDEV-NOTE: Controls unique redirection

    // AIDEV-NOTE: Controlled logging only in development
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('🎯 [AppContext] hubUrlToLoad mudou para:', hubUrlToLoad);
        }
    }, [hubUrlToLoad]);

    // AIDEV-NOTE: Hub loading with useQuery and network service with robust error handling
    const {
        data: currentHubData,
        isLoading: hubLoading,
        error: hubError,
        refetch: refetchHub
    } = useQuery({
        queryKey: ['hub', hubUrlToLoad],
        queryFn: async () => {
            if (!hubUrlToLoad) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('⚠️ [AppContext] useQuery: hubUrlToLoad é null/undefined');
                }
                return null;
            }
            
            try {
                if (process.env.NODE_ENV === 'development') {
                    console.log('🎯 [AppContext] useQuery: Carregando hub:', hubUrlToLoad);
                }
                const data = await loadHubJSON(hubUrlToLoad);
                
                // AIDEV-NOTE: Saves hub to user data if connected
                if (data?.hub && remoteStorage.connected) {
                    api.addHub(hubUrlToLoad, data.hub.title, data.hub.icon?.url);
                }
                
                if (process.env.NODE_ENV === 'development') {
                    console.log('✅ [AppContext] useQuery: Hub carregado com sucesso:', data.hub?.title);
                }
                return data;
            } catch (error) {
                console.error('❌ [AppContext] useQuery: Erro ao carregar hub:', error);
                throw new Error(`Falha ao carregar o hub: ${error.message}`);
            }
        },
        enabled: !!hubUrlToLoad,
        retry: false, // AIDEV-NOTE: Disabled retry to prevent infinite loops
        retryDelay: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false, // AIDEV-NOTE: Prevent automatic refetch
        refetchOnMount: false, // AIDEV-NOTE: Prevent refetch on mount
        refetchOnReconnect: false, // AIDEV-NOTE: Prevent refetch on reconnection
    });

    // AIDEV-NOTE: Removed automatic redirection that caused navigation issues
    // Redirection is now handled by useHubLoader

    const {
        loading: itemLoading,
        error: itemError,
        selectItem,
        selectedItemData,
        clearSelectedItem
    } = useItem();

    // AIDEV-NOTE: Refreshes user data when RemoteStorage is connected
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
        if (process.env.NODE_ENV === 'development') {
            console.log('🚀 [AppContext] loadHub chamado com URL:', url);
        }
        
        // AIDEV-NOTE: Prevents loading same URL multiple times
        if (hubUrlToLoad === url) {
            if (process.env.NODE_ENV === 'development') {
                console.log('⚠️ [AppContext] URL já está sendo carregada, ignorando...');
            }
            return Promise.resolve(true);
        }
        
        setLastAttemptedUrl(url);
        setHubUrlToLoad(url);
        return Promise.resolve(true);
    }, [hubUrlToLoad]);

    // AIDEV-NOTE: Retry function for hub loading errors
    const retryLoadHub = useCallback(() => {
        if (lastAttemptedUrl) {
            if (process.env.NODE_ENV === 'development') {
                console.log('[AppContext] Tentando recarregar hub:', lastAttemptedUrl);
            }
            refetchHub();
        }
    }, [lastAttemptedUrl, refetchHub]);

    // AIDEV-NOTE: Clears hub state and returns to initial placeholder
    const clearHubData = useCallback(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('🧹 [AppContext] Limpando dados do hub para voltar ao placeholder');
        }
        
        setHubUrlToLoad(null);
        setLastAttemptedUrl("");
        setHasRedirectedToHub(false);
        
        // AIDEV-NOTE: Also clears React Query cache for this hub
        if (hubUrlToLoad) {
            queryClient.invalidateQueries(['hub', hubUrlToLoad]);
        }
    }, [hubUrlToLoad, queryClient]);

    // AIDEV-NOTE: Toggles pin status with robust error handling
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
        currentHubUrl: hubUrlToLoad, // AIDEV-NOTE: Export hubUrlToLoad as currentHubUrl for navigation
        hubLoading,
        hubError: hubError ? hubError.message : null,
        isSyncing,
        conflictMessage,
        isOffline,
        lastAttemptedUrl,
        isConnected,
        loadHub,
        retryLoadHub, // AIDEV-NOTE: New retry function for errors
        clearHubData, // AIDEV-NOTE: Function to clear hub data
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
