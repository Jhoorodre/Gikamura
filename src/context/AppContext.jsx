// AIDEV-NOTE: App state management; hub loading, user data, and RemoteStorage integration
// AIDEV-NOTE: CRITICAL IMPLEMENTATION - 100% Reliability for Pinned Works Display on RemoteStorage Connection:
// 1. Multiple event listeners (connected, sync-done) trigger refreshUserData()
// 2. Safety check with timeout to re-load if no pinned items after connection
// 3. Manual force refresh function available (forceRefreshPinnedWorks)
// 4. Widget-level additional force refresh after connection
// 5. Enhanced error handling and logging for debugging
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useItem } from '../hooks/useItem';
import { remoteStorage } from '../services/remotestorage';
import { RS_PATH } from '../services/rs/rs-config.js';
import api, { clearCaches } from '../services/api.js';
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
    const refreshTimeoutRef = useRef(null); // AIDEV-NOTE: Timeout ref for debouncing refresh calls
    const refreshInProgressRef = useRef(false); // AIDEV-NOTE: Prevent concurrent refresh operations
    const cleanupRunRef = useRef(false); // AIDEV-NOTE: Track if cleanup has run

    // AIDEV-NOTE: Controlled logging only in development
    useEffect(() => {
        if (import.meta.env?.DEV) {
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
                if (import.meta.env?.DEV) {
                    console.log('⚠️ [AppContext] useQuery: hubUrlToLoad é null/undefined');
                }
                return null;
            }
            
            try {
                if (import.meta.env?.DEV) {
                    console.log('🎯 [AppContext] useQuery: Carregando hub:', hubUrlToLoad);
                }
                const data = await loadHubJSON(hubUrlToLoad);
                
                // AIDEV-NOTE: Saves hub to user data if connected
                if (data?.hub && remoteStorage.connected) {
                    api.addHub(hubUrlToLoad, data.hub.title, data.hub.icon?.url);
                }
                
                if (import.meta.env?.DEV) {
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

    // AIDEV-NOTE: CRITICAL - Refreshes user data when RemoteStorage is connected, ensuring pinned works are loaded
    const refreshUserData = useCallback(() => {
        // AIDEV-NOTE: Prevent concurrent refresh operations
        if (refreshInProgressRef.current) {
            console.log('⏳ [AppContext] refreshUserData: Refresh já em andamento, ignorando...');
            return;
        }

        refreshInProgressRef.current = true;
        
        if (remoteStorage.connected) {
            if (import.meta.env?.DEV) {
                console.log('🔄 [AppContext] refreshUserData: Carregando dados do usuário...');
            }
            
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
        }
        
        // AIDEV-NOTE: Reset the flag after a delay to allow operations to complete
        setTimeout(() => {
            refreshInProgressRef.current = false;
        }, 1000);
    }, [remoteStorage.connected]); // AIDEV-NOTE: Dependency on connected state to prevent unnecessary calls
    const handleChange = useCallback((event) => {
        if (event.path.startsWith(`/${RS_PATH}/`)) {
            // AIDEV-NOTE: Debounce refresh to prevent multiple rapid calls
            clearTimeout(refreshTimeoutRef.current);
            refreshTimeoutRef.current = setTimeout(() => {
                refreshUserData();
            }, 300); // 300ms debounce
        }
    }, [refreshUserData]);
    useEffect(() => {
        const handleConnectionChange = () => {
            const isNowConnected = remoteStorage.connected;
            setIsConnected(isNowConnected);
            // AIDEV-NOTE: Reset sync flag and refresh user data when connecting to ensure cleanup runs again
            if (isNowConnected) {
                console.log('🔌 [AppContext] RemoteStorage conectado - resetando sync e recarregando dados');
                api.resetSync(); // AIDEV-NOTE: Allow sync to run again for cleanup
                clearCaches(); // AIDEV-NOTE: Clear API caches on connection
                cleanupRunRef.current = false; // AIDEV-NOTE: Reset cleanup flag
                refreshUserData();
            }
        };
        const handleSyncReqDone = () => setIsSyncing(true);
        const handleSyncDone = () => {
            setIsSyncing(false);
            // AIDEV-NOTE: Refresh user data after sync completes with better control to prevent loops
            if (remoteStorage.connected && !refreshInProgressRef.current) {
                // AIDEV-NOTE: Only run cleanup once per session to prevent loops
                if (!cleanupRunRef.current) {
                    cleanupRunRef.current = true;
                    console.log('🧹 [AppContext] handleSyncDone: Executando limpeza única pós-sync...');
                    setTimeout(() => {
                        api.cleanupCorruptedData().then((cleaned) => {
                            if (cleaned) {
                                console.log('🧹 [AppContext] handleSyncDone: Limpeza concluída, atualizando dados...');
                                clearCaches(); // AIDEV-NOTE: Clear caches after cleanup
                                refreshUserData();
                            } else {
                                console.log('🧹 [AppContext] handleSyncDone: Nenhuma limpeza necessária, atualizando dados...');
                                refreshUserData();
                            }
                        }).catch(error => {
                            console.error('❌ [AppContext] handleSyncDone: Erro na limpeza:', error);
                            refreshUserData(); // Refresh anyway
                        });
                    }, 1500); // AIDEV-NOTE: Longer delay to ensure sync is completely done
                } else {
                    console.log('🔄 [AppContext] handleSyncDone: Limpeza já executada, apenas atualizando dados...');
                    refreshUserData();
                }
            }
        };
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
            clearTimeout(refreshTimeoutRef.current); // AIDEV-NOTE: Cleanup timeout on unmount
            remoteStorage.removeEventListener('connected', handleConnectionChange);
            remoteStorage.removeEventListener('disconnected', handleConnectionChange);
            remoteStorage.removeEventListener('sync-req-done', handleSyncReqDone);
            remoteStorage.removeEventListener('sync-done', handleSyncDone);
            remoteStorage.removeEventListener('conflict', handleConflict);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };

        // AIDEV-NOTE: Cleanup timeout on unmount
        return () => {
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }
        };
    }, [refreshUserData]);
    // AIDEV-NOTE: CRITICAL - Ensures pinned works are ALWAYS displayed on "Obras" page when RemoteStorage connects
    useEffect(() => {
        if (isConnected && remoteStorage.private) {
            // AIDEV-NOTE: Double-ensure data is loaded when connection is established
            refreshUserData();
            remoteStorage.private.on('change', handleChange);
            return () => {
                clearTimeout(refreshTimeoutRef.current); // AIDEV-NOTE: Cleanup timeout
                if (remoteStorage.private) {
                    remoteStorage.private.removeEventListener('change', handleChange);
                }
            };
        }
    }, [isConnected, refreshUserData, handleChange]);

    // loadHub agora só define a URL com recuperação de erro
    const loadHub = useCallback((url) => {
        if (import.meta.env?.DEV) {
            console.log('🚀 [AppContext] loadHub chamado com URL:', url);
        }
        
        // AIDEV-NOTE: Prevents loading same URL multiple times
        if (hubUrlToLoad === url) {
            if (import.meta.env?.DEV) {
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
            if (import.meta.env?.DEV) {
                console.log('[AppContext] Tentando recarregar hub:', lastAttemptedUrl);
            }
            refetchHub();
        }
    }, [lastAttemptedUrl, refetchHub]);

    // AIDEV-NOTE: Clears hub state and returns to initial placeholder
    const clearHubData = useCallback(() => {
        if (import.meta.env?.DEV) {
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

    /**
     * ✅ CORREÇÃO: Recebe o objeto 'item' completo e passa-o
     * diretamente para a função da API correspondente.
     */
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

    // AIDEV-NOTE: CRITICAL - Additional safety check to ensure pinned works are loaded when RemoteStorage connects
    useEffect(() => {
        let hasFired = false; // AIDEV-NOTE: Prevent multiple executions
        
        if (isConnected && pinnedItems.length === 0 && !hasFired) {
            hasFired = true;
            // AIDEV-NOTE: If connected but no pinned items loaded, force refresh after a short delay
            const timeoutId = setTimeout(() => {
                if (import.meta.env?.DEV) {
                    console.log('🔄 [AppContext] Safety check: Re-loading pinned works after connection');
                }
                refreshUserData();
            }, 1000); // 1 second delay to allow initial sync
            
            return () => clearTimeout(timeoutId);
        }
    }, [isConnected, refreshUserData]); // AIDEV-NOTE: Removed pinnedItems.length to prevent loops

    // AIDEV-NOTE: Force refresh of pinned works - can be called manually to ensure 100% reliability
    const forceRefreshPinnedWorks = useCallback(() => {
        if (import.meta.env?.DEV) {
            console.log('🔃 [AppContext] forceRefreshPinnedWorks: Forçando recarregamento das obras pinadas');
        }
        refreshUserData();
    }, [refreshUserData]);

    // AIDEV-NOTE: Robust hub removal with proper state management and error handling
    const handleRemoveHub = useCallback(async (url) => {
        try {
            console.log(`[AppContext] Iniciando remoção do hub: ${url}`);
            
            // AIDEV-NOTE: Check if hub still exists before attempting removal
            const currentHubs = await api.getAllHubs();
            const hubExists = currentHubs.some(hub => hub.url === url);
            
            if (!hubExists) {
                console.warn(`[AppContext] Hub já foi removido automaticamente: ${url}`);
                // AIDEV-NOTE: Force refresh even if hub doesn't exist to sync UI state
                await refreshUserData();
                return Promise.resolve();
            }
            
            await api.removeHub(url);
            
            // AIDEV-NOTE: Force refresh of user data to update savedHubs state
            console.log('[AppContext] Hub removido, atualizando dados do usuário...');
            await refreshUserData();
            
            return Promise.resolve();
        } catch (error) {
            console.error('[AppContext] Erro ao remover hub:', error);
            
            // AIDEV-NOTE: Handle graceful failure and always refresh data to reflect actual state
            if (error.message && error.message.includes('non-existing')) {
                console.warn('[AppContext] Hub já foi removido, sincronizando estado da UI...');
            } else {
                console.log('[AppContext] Atualizando dados após erro de remoção...');
            }
            await refreshUserData();
            
            throw error;
        }
    }, [refreshUserData]);

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
        removeHub: handleRemoveHub, // AIDEV-NOTE: Use robust wrapper instead of direct API call
        togglePinStatus,
        refreshUserData,
        forceRefreshPinnedWorks, // AIDEV-NOTE: Manual force refresh for 100% reliability
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
