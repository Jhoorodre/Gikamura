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
    const [hasRedirectedToHub, setHasRedirectedToHub] = useState(false); // Controla redirecionamento único

    // Debug: Log quando hubUrlToLoad muda
    // Log controlado apenas em desenvolvimento
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('🎯 [AppContext] hubUrlToLoad mudou para:', hubUrlToLoad);
        }
    }, [hubUrlToLoad]);

    // Carregamento do Hub com useQuery e novo serviço de rede
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
                
                // Salva o hub nos dados do usuário se conectado
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
        retry: false, // TEMPORÁRIO: Desabilitar retry para evitar loop infinito
        retryDelay: false,
        staleTime: 5 * 60 * 1000, // 5 minutos
        gcTime: 10 * 60 * 1000, // 10 minutos
        refetchOnWindowFocus: false, // Evitar refetch automático
        refetchOnMount: false, // Evitar refetch no mount
        refetchOnReconnect: false, // Evitar refetch na reconexão
    });

    // REMOVIDO: Redirecionamento automático que causava problemas de navegação
    // O redirecionamento agora é responsabilidade do useHubLoader

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
        if (process.env.NODE_ENV === 'development') {
            console.log('🚀 [AppContext] loadHub chamado com URL:', url);
        }
        
        // Evitar carregar a mesma URL várias vezes
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

    // Função para tentar recarregar hub em caso de erro
    const retryLoadHub = useCallback(() => {
        if (lastAttemptedUrl) {
            if (process.env.NODE_ENV === 'development') {
                console.log('[AppContext] Tentando recarregar hub:', lastAttemptedUrl);
            }
            refetchHub();
        }
    }, [lastAttemptedUrl, refetchHub]);

    // Função para limpar o estado do hub e voltar ao placeholder inicial
    const clearHubData = useCallback(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('🧹 [AppContext] Limpando dados do hub para voltar ao placeholder');
        }
        
        setHubUrlToLoad(null);
        setLastAttemptedUrl("");
        setHasRedirectedToHub(false);
        
        // Limpa também o cache do React Query para este hub
        if (hubUrlToLoad) {
            queryClient.invalidateQueries(['hub', hubUrlToLoad]);
        }
    }, [hubUrlToLoad, queryClient]);

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
        clearHubData, // Função para limpar dados do hub
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
