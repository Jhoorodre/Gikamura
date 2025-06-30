import React, { createContext, useContext, useState, useEffect } from 'react';
import { useItem } from '../hooks/useItem';
import { fetchData } from '../services/api';
import { remoteStorage } from '../services/remoteStorage';

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
    const { loading: itemLoading, error: itemError, fetchItemData } = useItem();

    useEffect(() => {
        const handleConnectionChange = () => setIsConnected(remoteStorage.connected);
        const handleSyncReqDone = () => setIsSyncing(true);
        const handleSyncDone = () => setIsSyncing(false);
        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => setIsOffline(false);
        const handleConflict = (e) => {
            console.warn("Conflito de dados:", e);
            setConflictMessage("Conflito de dados detectado. A versão mais recente foi aplicada.");
            setTimeout(() => setConflictMessage(null), 7000);
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

    const loadHub = async (url) => {
        setHubLoading(true);
        setHubError(null);
        try {
            const data = await fetchData(url);
            setHubData(data);
        } catch (err) {
            setHubError(err.message);
        } finally {
            setHubLoading(false);
        }
    };

    const value = {
        currentHubData,
        hubLoading,
        hubError,
        isSyncing,
        conflictMessage,
        isOffline,
        isConnected,
        loadHub,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
