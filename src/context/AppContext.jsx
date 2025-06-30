import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useItem } from '../hooks/useItem';
import { fetchData } from '../services/fetchWithCache.js';
import { remoteStorage } from '../services/remotestorage';
import { RS_PATH } from '../services/rs/rs-config.js'; // Importa a constante que faltava
import api from '../services/api.js'; // Importa a API de lógica de negócio

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    const [currentHubData, setHubData] = useState(null);
    const [hubLoading, setHubLoading] = useState(false);
    const [hubError, setHubError] = useState(null);
    const [isConnected, setIsConnected] = useState(remoteStorage.connected);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
    const [conflictMessage, setConflictMessage] = useState(null);
    const [lastAttemptedUrl, setLastAttemptedUrl] = useState("");

    // Novos estados para gerenciar o histórico e os itens fixados
    const [pinnedItems, setPinnedItems] = useState([]);
    const [historyItems, setHistoryItems] = useState([]);
    const [savedHubs, setSavedHubs] = useState([]);

    const {
        loading: itemLoading,
        error: itemError,
        fetchItemData, // O hook exporta como fetchItemData
        selectedItemData,
        clearSelectedItem
    } = useItem();

    // Função para recarregar os dados do RemoteStorage
    const refreshUserData = useCallback(() => {
        if (remoteStorage.connected) {
            api.getAllPinnedSeries().then(setPinnedItems);
            api.getAllUnpinnedSeries().then(setHistoryItems);
            api.getAllHubs().then(setSavedHubs);
        }
    }, []);

    const handleChange = useCallback((event) => {
        // Verifica se a mudança ocorreu dentro do caminho do nosso módulo
        if (event.path.startsWith(`/${RS_PATH}/`)) {
            console.log(`Mudança detectada no módulo ${RS_PATH}, recarregando dados do usuário.`);
            refreshUserData();
        }
    }, [refreshUserData]);

    // Este useEffect gerencia os eventos globais do remoteStorage e da janela.
    useEffect(() => {
        const handleConnectionChange = () => setIsConnected(remoteStorage.connected);
        const handleSyncReqDone = () => setIsSyncing(true);
        const handleSyncDone = () => setIsSyncing(false);
        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => setIsOffline(false);
        const handleConflict = (conflictEvent) => {
            console.warn("Conflito detectado:", conflictEvent);
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
    }, []); // Este efeito deve rodar apenas uma vez.

    // Este useEffect reage à mudança de status da conexão.
    useEffect(() => {
        // Apenas executa quando conectado E o cliente 'private' está inicializado.
        if (isConnected && remoteStorage.private) {
            refreshUserData();
            remoteStorage.private.on('change', handleChange);

            // A função de limpeza também deve verificar se 'private' existe.
            return () => {
                if (remoteStorage.private) {
                    remoteStorage.private.removeEventListener('change', handleChange);
                }
            };
        }
    }, [isConnected, refreshUserData, handleChange]);

    const loadHub = async (url) => {
        setHubLoading(true);
        setHubError(null);
        setLastAttemptedUrl(url); // Salva a URL que estamos tentando carregar
        try {
            const data = await fetchData(url);
            setHubData(data);
            // Salva o hub no histórico após o carregamento bem-sucedido.
            if (data?.hub) {
                // O evento 'change' do remoteStorage irá atualizar a lista de hubs automaticamente.
                api.addHub(url, data.hub.title, data.hub.icon?.url);
            }
        } catch (err) {
            setHubError(err.message);
        } finally {
            setHubLoading(false);
        }
    };

    const togglePinStatus = useCallback(async (item) => {
        if (!item || !item.slug || !item.sourceId) return;
        try {
            if (item.pinned) {
                await api.unpinSeries(item.slug, item.sourceId);
            } else {
                await api.pinSeries(item.slug, item.sourceId);
            }
            // A UI será atualizada automaticamente pelo evento 'change' do remoteStorage,
            // que chama refreshUserData().
        } catch (error) {
            console.error("Falha ao alterar o estado de 'fixado':", error);
        }
    }, []);

    const value = {
        currentHubData,
        hubLoading,
        hubError,
        isSyncing,
        conflictMessage,
        isOffline,
        lastAttemptedUrl,
        isConnected,
        loadHub,
        itemLoading,
        // Exporta os novos estados e a função de refresh
        pinnedItems,
        historyItems,
        savedHubs,
        addHub: api.addHub,
        removeHub: api.removeHub,
        togglePinStatus,
        refreshUserData,
        itemError,
        selectedItemData,
        selectItem: fetchItemData, // Renomeia fetchItemData para selectItem para clareza
        clearSelectedItem,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
