// src/hooks/useHistory.js
import { useState, useEffect, useCallback } from 'react';
import { remoteStorage } from '../services/remotestorage';
import { RS_PATH } from '../services/rs/rs-config';

export const useHistory = () => {
    const [savedHubs, setSavedHubs] = useState([]);
    const [isConnected, setIsConnected] = useState(remoteStorage.connected);

    const loadSavedHubs = useCallback(async () => {
        if (remoteStorage.connected && remoteStorage[RS_PATH.BASE]) {
            try {
                const hubs = await remoteStorage[RS_PATH.BASE].getAllHubs();
                setSavedHubs(hubs || []);
            } catch (error) {
                console.error("Erro ao carregar hubs salvos:", error);
                setSavedHubs([]);
            }
        }
    }, []);

    useEffect(() => {
        const handleConnectionChange = () => {
            const connectionStatus = remoteStorage.connected;
            setIsConnected(connectionStatus);
            if (connectionStatus) {
                loadSavedHubs();
            } else {
                setSavedHubs([]);
            }
        };

        const handleSyncDone = () => {
            console.log("Sincronização concluída, recarregando hubs.");
            loadSavedHubs();
        };

        remoteStorage.addEventListener('connected', handleConnectionChange);
        remoteStorage.addEventListener('disconnected', handleConnectionChange);
        remoteStorage.addEventListener('sync-done', handleSyncDone);

        // Carga inicial
        handleConnectionChange();

        return () => {
            remoteStorage.removeEventListener('connected', handleConnectionChange);
            remoteStorage.removeEventListener('disconnected', handleConnectionChange);
            remoteStorage.removeEventListener('sync-done', handleSyncDone);
        };
    }, [loadSavedHubs]);

    const addHub = (url, title, iconUrl) => {
        if (remoteStorage.connected && remoteStorage[RS_PATH.BASE]) {
            return remoteStorage[RS_PATH.BASE].addHub(url, title, iconUrl);
        }
    };
    
    const removeHub = (url) => {
        if (remoteStorage.connected && remoteStorage[RS_PATH.BASE]) {
            return remoteStorage[RS_PATH.BASE].removeHub(url);
        }
    };

    return { isConnected, savedHubs, addHub, removeHub, loadSavedHubs };
};
