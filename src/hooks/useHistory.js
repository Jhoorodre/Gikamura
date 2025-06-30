// src/hooks/useHistory.js
import { useState, useEffect, useCallback } from 'react';
import { remoteStorage, globalHistoryHandler } from '../services/remoteStorage';

export const useHistory = () => {
    const [savedHubs, setSavedHubs] = useState([]);
    const [isConnected, setIsConnected] = useState(remoteStorage.connected);

    const loadSavedHubs = useCallback(async () => {
        if (remoteStorage.connected) {
            try {
                const hubs = await globalHistoryHandler.getAllHubs();
                setSavedHubs(hubs || []);
            } catch (error) {
                console.error("Erro ao carregar hubs salvos:", error);
                // Você pode querer definir um estado de erro aqui para a UI
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

        // CORREÇÃO: Usar 'sync-done' para recarregar os dados após a sincronização.
        const handleDataChange = () => {
            console.log("Sincronização concluída, recarregando hubs.");
            loadSavedHubs();
        };

        remoteStorage.on('connected', handleConnectionChange);
        remoteStorage.on('disconnected', handleConnectionChange);
        remoteStorage.on('sync-done', handleDataChange); // <--- A LINHA CORRIGIDA

        // Carga inicial
        handleConnectionChange();

        return () => {
            remoteStorage.removeEventListener('connected', handleConnectionChange);
            remoteStorage.removeEventListener('disconnected', handleConnectionChange);
            remoteStorage.removeEventListener('sync-done', handleDataChange); // <--- A LINHA CORRIGIDA
        };
    }, [loadSavedHubs]);

    const addHub = (url, title, iconUrl) => {
        return globalHistoryHandler.addHub(url, title, iconUrl);
    };
    
    const removeHub = (url) => {
        return globalHistoryHandler.removeHub(url);
    };

    return { isConnected, savedHubs, addHub, removeHub, loadSavedHubs };
};
