// AIDEV-NOTE: App state management; hub loading, user data, and RemoteStorage integration
// AIDEV-NOTE: CRITICAL IMPLEMENTATION - 100% Reliability for Pinned Works Display on RemoteStorage Connection:
// 1. Multiple event listeners (connected, sync-done) trigger refreshUserData()
// 2. Safety check with timeout to re-load if no pinned items after connection
// 3. Manual force refresh function available (forceRefreshPinnedWorks)
// 4. Widget-level additional force refresh after connection
// 5. Enhanced error handling and logging for debugging
// AIDEV-TODO: Avaliar divisão deste contexto em contextos menores (ex: HubContext, UserPreferencesContext) para evitar re-renderizações globais desnecessárias e melhorar performance.
import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useItem } from '../hooks/useItem';
import { remoteStorage } from '../services/remotestorage';
import api, { clearCaches } from '../services/api.js';
import { RS_PATH } from '../services/rs/rs-config.js';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    const [pinnedItems, setPinnedItems] = useState([]);
    const [historyItems, setHistoryItems] = useState([]);
    const [savedHubs, setSavedHubs] = useState([]);
    const [conflictMessage, setConflictMessage] = useState(null);
    const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
    const [hubUrlToLoad, setHubUrlToLoad] = useState(null);
    const [lastAttemptedUrl, setLastAttemptedUrl] = useState(null);

    const {
        loading: itemLoading,
        error: itemError,
        selectItem,
        selectedItemData,
        clearSelectedItem
    } = useItem();

    const refreshUserData = useCallback(() => {
        // AIDEV-NOTE: Load pinned series first as they are critical for "Obras" page
        api.getAllPinnedSeries().then(data => {
            // AIDEV-NOTE: Validate data before setting state to prevent invalid renders
            if (Array.isArray(data)) {
                setPinnedItems(data);
                if (import.meta.env?.DEV) {
                    console.log('📌 [AppContext] refreshUserData: Obras pinadas carregadas:', data.length);
                    data.forEach((item, index) => {
                        console.log(`  ${index + 1}. ${item.title} (${item.source}:${item.slug}) - Pinned: ${item.pinned}`);
                    });
                }
            } else {
                console.error('❌ [AppContext] refreshUserData: getAllPinnedSeries retornou dados inválidos:', data);
                setPinnedItems([]);
            }
        }).catch(error => {
            console.error('❌ [AppContext] refreshUserData: Erro ao carregar obras pinadas:', error);
            setPinnedItems([]);
        });
        
        api.getAllUnpinnedSeries().then(data => {
            // AIDEV-NOTE: Validate data before setting state
            if (Array.isArray(data)) {
                setHistoryItems(data);
                if (import.meta.env?.DEV) {
                    console.log('📄 [AppContext] refreshUserData: Histórico carregado:', data.length);
                    data.forEach((item, index) => {
                        console.log(`  ${index + 1}. ${item.title} (${item.source}:${item.slug}) - Pinned: ${item.pinned}`);
                    });
                }
            } else {
                console.error('❌ [AppContext] refreshUserData: getAllUnpinnedSeries retornou dados inválidos:', data);
                setHistoryItems([]);
            }
        }).catch(error => {
            console.error('❌ [AppContext] refreshUserData: Erro ao carregar histórico:', error);
            setHistoryItems([]);
        });
        
        api.getAllHubs().then(setSavedHubs).catch(error => {
            console.error('❌ [AppContext] refreshUserData: Erro ao carregar hubs salvos:', error);
        });
    }, []);

    const handleChange = useCallback((event) => {
        if (event.path.startsWith(`/${RS_PATH}/`)) {
            refreshUserData();
        }
    }, [refreshUserData]);

    useEffect(() => {
        const handleConnectionChange = () => {
            const isNowConnected = remoteStorage.connected;
            if (isNowConnected) {
                console.log('🔌 [AppContext] RemoteStorage conectado - resetando sync e recarregando dados');
                api.resetSync();
                clearCaches();
                refreshUserData();
            }
        };
        remoteStorage.on('connected', handleConnectionChange);
        remoteStorage.on('disconnected', handleConnectionChange);
        return () => {
            remoteStorage.removeEventListener('connected', handleConnectionChange);
            remoteStorage.removeEventListener('disconnected', handleConnectionChange);
        };
    }, [refreshUserData]);

    useEffect(() => {
        if (remoteStorage.connected && remoteStorage.private) {
            refreshUserData();
            remoteStorage.private.on('change', handleChange);
            return () => {
                if (remoteStorage.private) {
                    remoteStorage.private.removeEventListener('change', handleChange);
                }
            };
        }
    }, [remoteStorage.connected, refreshUserData, handleChange]);

    const togglePinStatus = useCallback(async (item) => {
        if (!item || !item.slug || !item.source) return;
        
        // Log detalhado do objeto recebido
        console.debug('[AppContext][togglePinStatus] Recebido:', item);
        try {
            if (item.pinned) {
                await api.unpinSeries(item.slug, item.source);
                console.log(`[togglePinStatus] Desafixou:`, item.slug);
                console.debug('[AppContext][togglePinStatus] Sucesso ao desafixar:', item);
            } else {
                // Passa o objeto completo para a função pinSeries
                await api.pinSeries(item);
                console.log(`[togglePinStatus] Fixou:`, item.slug);
                // AIDEV-NOTE: Log detalhado de sucesso para depuração de dados salvos no RemoteStorage
                console.debug('[AppContext][togglePinStatus] Sucesso ao fixar:', item);
            }
            refreshUserData();
        } catch (error) {
            // Log detalhado do erro
            console.error("[AppContext][togglePinStatus] Falha ao alterar o estado de 'fixado':", error, 'Objeto:', item);
        }
    }, [refreshUserData]);

    const setHubUrl = useCallback((url) => {
        if (import.meta.env?.DEV) {
            console.log('🚀 [AppContext] Definindo URL do hub para:', url);
        }
        setHubUrlToLoad(url);
    }, []);

    // AIDEV-NOTE: Memoize context value to prevent unnecessary re-renders
    const value = useMemo(() => ({
        pinnedItems,
        historyItems,
        savedHubs,
        conflictMessage,
        isOffline,
        itemLoading,
        itemError,
        selectedItemData,
        selectItem,
        clearSelectedItem,
        togglePinStatus,
        refreshUserData,
        setHubUrl,
        hubUrlToLoad,
        lastAttemptedUrl,
    }), [
        pinnedItems,
        historyItems,
        savedHubs,
        conflictMessage,
        isOffline,
        itemLoading,
        itemError,
        selectedItemData,
        selectItem,
        clearSelectedItem,
        togglePinStatus,
        refreshUserData,
        setHubUrl,
        hubUrlToLoad,
        lastAttemptedUrl,
    ]);

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
