import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useItem } from '../hooks/useItem';
import { remoteStorage } from '../services/remotestorage';
import { RS_PATH } from '../services/rs/rs-config.js';
import api from '../services/api.js';
import { CORS_PROXY_URL } from '../constants';

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

    // Carregamento do Hub com useQuery
    const {
        data: currentHubData,
        isLoading: hubLoading,
        error: hubError
    } = useQuery({
        queryKey: ['hub', hubUrlToLoad],
        queryFn: async () => {
            if (!hubUrlToLoad) return null;
            const response = await fetch(`${CORS_PROXY_URL}${encodeURIComponent(hubUrlToLoad)}`);
            if (!response.ok) {
                throw new Error(`Erro ao carregar o hub. Status: ${response.status}`);
            }
            const data = await response.json();
            if (data?.hub) {
                api.addHub(hubUrlToLoad, data.hub.title, data.hub.icon?.url);
            }
            return data;
        },
        enabled: !!hubUrlToLoad,
        retry: false,
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

    // loadHub agora só define a URL
    const loadHub = useCallback((url) => {
        setLastAttemptedUrl(url);
        setHubUrlToLoad(url);
    }, []);

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
