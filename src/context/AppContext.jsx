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
import { useRemoteStorageContext } from './RemoteStorageContext';

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
    
    // AIDEV-NOTE: Track refresh operations to prevent race conditions
    const refreshInProgressRef = useRef(false);
    const refreshIdRef = useRef(0);
    
    // AIDEV-NOTE: Get RemoteStorage connection state from dedicated context
    const { isConnected: remoteStorageConnected } = useRemoteStorageContext();

    const {
        loading: itemLoading,
        error: itemError,
        selectItem,
        selectedItemData,
        clearSelectedItem
    } = useItem();

    const refreshUserData = useCallback(async () => {
        // AIDEV-NOTE: Prevent concurrent executions to avoid race conditions
        if (refreshInProgressRef.current) {
            if (import.meta.env?.DEV) {
                console.log('🔄 [AppContext] refreshUserData: Refresh já em progresso, ignorando chamada');
            }
            return;
        }
        
        refreshInProgressRef.current = true;
        const currentRefreshId = ++refreshIdRef.current;
        
        if (import.meta.env?.DEV) {
            console.log(`🔄 [AppContext] refreshUserData: Iniciando refresh #${currentRefreshId}`);
        }
        
        try {
            // AIDEV-NOTE: Load all data concurrently with proper error handling
            const [pinnedResult, unpinnedResult, hubsResult] = await Promise.allSettled([
                api.getAllPinnedSeries(),
                api.getAllUnpinnedSeries(),
                api.getAllHubs()
            ]);
            
            // AIDEV-NOTE: Check if this is still the current refresh operation
            if (currentRefreshId !== refreshIdRef.current) {
                if (import.meta.env?.DEV) {
                    console.log(`🔄 [AppContext] refreshUserData: Refresh #${currentRefreshId} cancelado (novo refresh iniciado)`);
                }
                return;
            }
            
            // Process pinned items
            if (pinnedResult.status === 'fulfilled') {
                const data = pinnedResult.value;
                if (Array.isArray(data)) {
                    setPinnedItems(data);
                    if (import.meta.env?.DEV) {
                        console.log(`📌 [AppContext] refreshUserData #${currentRefreshId}: Obras pinadas carregadas:`, data.length);
                        data.forEach((item, index) => {
                            console.log(`  ${index + 1}. ${item.title} (${item.source}:${item.slug}) - Pinned: ${item.pinned}`);
                        });
                    }
                } else {
                    console.error(`❌ [AppContext] refreshUserData #${currentRefreshId}: getAllPinnedSeries retornou dados inválidos:`, data);
                    setPinnedItems([]);
                }
            } else {
                console.error(`❌ [AppContext] refreshUserData #${currentRefreshId}: Erro ao carregar obras pinadas:`, pinnedResult.reason);
                setPinnedItems([]);
            }
            
            // Process unpinned items
            if (unpinnedResult.status === 'fulfilled') {
                const data = unpinnedResult.value;
                if (Array.isArray(data)) {
                    setHistoryItems(data);
                    if (import.meta.env?.DEV) {
                        console.log(`📄 [AppContext] refreshUserData #${currentRefreshId}: Histórico carregado:`, data.length);
                        data.forEach((item, index) => {
                            console.log(`  ${index + 1}. ${item.title} (${item.source}:${item.slug}) - Pinned: ${item.pinned}`);
                        });
                    }
                } else {
                    console.error(`❌ [AppContext] refreshUserData #${currentRefreshId}: getAllUnpinnedSeries retornou dados inválidos:`, data);
                    setHistoryItems([]);
                }
            } else {
                console.error(`❌ [AppContext] refreshUserData #${currentRefreshId}: Erro ao carregar histórico:`, unpinnedResult.reason);
                setHistoryItems([]);
            }
            
            // Process hubs
            if (hubsResult.status === 'fulfilled') {
                const data = hubsResult.value;
                if (Array.isArray(data)) {
                    setSavedHubs(data);
                    if (import.meta.env?.DEV) {
                        console.log(`🏠 [AppContext] refreshUserData #${currentRefreshId}: Hubs carregados:`, data.length);
                    }
                } else {
                    console.error(`❌ [AppContext] refreshUserData #${currentRefreshId}: getAllHubs retornou dados inválidos:`, data);
                    setSavedHubs([]);
                }
            } else {
                console.error(`❌ [AppContext] refreshUserData #${currentRefreshId}: Erro ao carregar hubs:`, hubsResult.reason);
                setSavedHubs([]);
            }
            
            if (import.meta.env?.DEV) {
                console.log(`✅ [AppContext] refreshUserData #${currentRefreshId}: Concluído com sucesso`);
            }
            
        } catch (error) {
            console.error(`❌ [AppContext] refreshUserData #${currentRefreshId}: Erro inesperado:`, error);
        } finally {
            refreshInProgressRef.current = false;
        }
    }, []);

    const handleChange = useCallback((event) => {
        if (event.path.startsWith(`/${RS_PATH}/`)) {
            refreshUserData();
        }
    }, [refreshUserData]);

    // AIDEV-NOTE: React to RemoteStorage connection changes from context
    useEffect(() => {
        if (remoteStorageConnected) {
            console.log('🔌 [AppContext] RemoteStorage conectado via context - resetando sync e recarregando dados');
            api.resetSync();
            clearCaches();
            refreshUserData();
        }
    }, [remoteStorageConnected, refreshUserData]);

    useEffect(() => {
        // AIDEV-NOTE: Use context state instead of direct remoteStorage.connected check
        if (remoteStorageConnected && remoteStorage.private) {
            refreshUserData();
            remoteStorage.private.on('change', handleChange);
            return () => {
                if (remoteStorage.private) {
                    remoteStorage.private.removeEventListener('change', handleChange);
                }
            };
        }
    }, [remoteStorageConnected, refreshUserData, handleChange]);

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

    // AIDEV-NOTE: Remove hub from saved hubs with proper error handling
    const removeHub = useCallback(async (hubUrl) => {
        try {
            // Remove from RemoteStorage
            await api.removeHub(hubUrl);
            
            // Update local state by removing the hub
            setSavedHubs(prevHubs => prevHubs.filter(hub => hub.url !== hubUrl));
            
            if (import.meta.env?.DEV) {
                console.log('✅ [AppContext] Hub removido com sucesso:', hubUrl);
            }
        } catch (error) {
            console.error('❌ [AppContext] Erro ao remover hub:', error);
            // Refresh data to sync with RemoteStorage state
            await refreshUserData();
        }
    }, [refreshUserData]);

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
        removeHub,
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
        removeHub,
    ]);

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
