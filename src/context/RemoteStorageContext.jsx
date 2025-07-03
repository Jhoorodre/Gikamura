// AIDEV-NOTE: RemoteStorage connection and sync management with anti-leak protection
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { remoteStorage } from '../services/remotestorage';

const RemoteStorageContext = createContext();

// AIDEV-NOTE: Global vars to control state between Strict Mode re-renders
let globalListenersSetup = false;
let globalAutoSyncInterval = null;

export const useRemoteStorageContext = () => useContext(RemoteStorageContext);

export const RemoteStorageProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [syncStats, setSyncStats] = useState({ success: 0, errors: 0 });
    const [conflictMessage, setConflictMessage] = useState(null);

    // AIDEV-NOTE: Refs for interval and state control
    const autoSyncIntervalRef = useRef(null);
    const lastSyncAttemptRef = useRef(0);
    const listenersSetupRef = useRef(false);
    const isCleaningUpRef = useRef(false);

    // AIDEV-NOTE: Control constants to prevent spam
    const SYNC_COOLDOWN = 15000; // 15 seconds between syncs
    const AUTO_SYNC_INTERVAL = 60000; // 1 minute for auto-sync

    // AIDEV-NOTE: Prevents sync spam with cooldown and state checks
    const canSync = useCallback(() => {
        const now = Date.now();
        const timeSinceLastSync = now - lastSyncAttemptRef.current;
        const canSyncNow = timeSinceLastSync >= SYNC_COOLDOWN && !isSyncing && isConnected && !isCleaningUpRef.current;
        
        if (!canSyncNow) {
            const reason = !isConnected ? 'desconectado' : 
                         isSyncing ? 'sync em andamento' : 
                         timeSinceLastSync < SYNC_COOLDOWN ? `cooldown (${Math.ceil((SYNC_COOLDOWN - timeSinceLastSync) / 1000)}s)` :
                         'limpando contexto';
            console.log(`⏳ Sync bloqueado: ${reason}`);
        }
        
        return canSyncNow;
    }, [isSyncing, isConnected]);

    // AIDEV-NOTE: Forces sync with cooldown protection
    const forceSync = useCallback(async () => {
        if (!canSync()) {
            return false;
        }

        console.log('🔄 Iniciando sincronização forçada...');
        lastSyncAttemptRef.current = Date.now();
        
        try {
            if (remoteStorage.connected) {
                // AIDEV-NOTE: Forces sync through small operation that triggers sync
                const testKey = `sync-test-${Date.now()}`;
                await remoteStorage.scope('/').storeObject('sync-test', `test-${testKey}`, { timestamp: Date.now() });
                await remoteStorage.scope('/').remove(`sync-test`);
                
                console.log('✅ Sincronização forçada concluída');
                return true;
            } else {
                console.warn('⚠️ RemoteStorage não conectado');
                return false;
            }
        } catch (error) {
            console.error('❌ Erro ao forçar sincronização:', error);
            setSyncStats(prev => ({ ...prev, errors: prev.errors + 1 }));
            return false;
        }
    }, [canSync]);

    // AIDEV-NOTE: Prevents multiple intervals using global variable
    const enableAutoSync = useCallback(() => {
        if (globalAutoSyncInterval) {
            console.log('⚠️ Auto-sync já está ativado globalmente');
            return;
        }

        console.log('🔄 Ativando auto-sync com intervalo de 1 minuto');
        
        globalAutoSyncInterval = setInterval(() => {
            if (canSync()) {
                console.log('🔄 Auto-sync: executando sincronização automática');
                forceSync();
            }
        }, AUTO_SYNC_INTERVAL);
        
        autoSyncIntervalRef.current = globalAutoSyncInterval;
    }, [canSync, forceSync]);

    const disableAutoSync = useCallback(() => {
        if (globalAutoSyncInterval) {
            clearInterval(globalAutoSyncInterval);
            globalAutoSyncInterval = null;
            autoSyncIntervalRef.current = null;
            console.log('⏹️ Auto-sync desativado');
        }
    }, []);

    // AIDEV-NOTE: Prevents duplicate listener setup using global variable
    useEffect(() => {
        if (globalListenersSetup) {
            console.log('⚠️ Listeners já configurados globalmente, pulando...');
            return;
        }

        console.log('🔗 Configurando event listeners do RemoteStorage...');
        globalListenersSetup = true;
        listenersSetupRef.current = true;
        isCleaningUpRef.current = false;
        
        // AIDEV-NOTE: Event handlers with proper logging and state management
        const handleConnected = () => {
            console.log('🔌 RemoteStorage conectado');
            setIsConnected(true);
            setLastSyncTime(new Date());
            // AIDEV-NOTE: Activates auto-sync with delay to avoid immediate execution
            setTimeout(() => {
                if (!isCleaningUpRef.current && !autoSyncIntervalRef.current) {
                    enableAutoSync();
                }
            }, 10000); // 10 seconds delay
        };

        const handleDisconnected = () => {
            console.log('🔌 RemoteStorage desconectado');
            setIsConnected(false);
            disableAutoSync();
        };

        const handleSyncReqDone = () => {
            console.log('📡 Sync iniciado...');
            setIsSyncing(true);
        };

        const handleSyncDone = () => {
            console.log('✅ Sync concluído');
            setIsSyncing(false);
            setLastSyncTime(new Date());
            setSyncStats(prev => ({ ...prev, success: prev.success + 1 }));
        };

        // AIDEV-NOTE: Conflict handler with automatic resolution and user notification
        const handleConflict = (event) => {
            console.warn('⚠️ Conflito de sincronização detectado:', event);
            const message = event?.path 
                ? `Conflito em "${event.path}". Versão mais recente aplicada.`
                : 'Conflito de dados detectado. Versão mais recente aplicada.';
            setConflictMessage(message);
            
            // AIDEV-NOTE: Auto-dismiss message after 8 seconds
            setTimeout(() => setConflictMessage(null), 8000);
        };

        const handleError = (error) => {
            console.error('❌ Erro do RemoteStorage:', error);
            setIsSyncing(false);
            setSyncStats(prev => ({ ...prev, errors: prev.errors + 1 }));
        };

        // AIDEV-NOTE: Add all RemoteStorage event listeners
        remoteStorage.on('connected', handleConnected);
        remoteStorage.on('disconnected', handleDisconnected);
        remoteStorage.on('sync-req-done', handleSyncReqDone);
        remoteStorage.on('sync-done', handleSyncDone);
        remoteStorage.on('conflict', handleConflict);
        remoteStorage.on('error', handleError);

        // AIDEV-NOTE: Set initial state
        setIsConnected(remoteStorage.connected);

        // AIDEV-NOTE: If already connected, activate auto-sync with larger delay
        if (remoteStorage.connected) {
            setTimeout(() => {
                if (!isCleaningUpRef.current && !autoSyncIntervalRef.current) {
                    enableAutoSync();
                }
            }, 10000); // 10 seconds delay to avoid multiple execution
        }

        return () => {
            console.log('🧹 Limpando RemoteStorage listeners e intervalos...');
            isCleaningUpRef.current = true;
            
            // AIDEV-NOTE: Cleanup auto-sync
            disableAutoSync();
            
            // AIDEV-NOTE: Only remove listeners if this is the last instance
            if (globalListenersSetup) {
                globalListenersSetup = false;
                listenersSetupRef.current = false;
                
                // AIDEV-NOTE: Cleanup all event listeners
                remoteStorage.removeEventListener('connected', handleConnected);
                remoteStorage.removeEventListener('disconnected', handleDisconnected);
                remoteStorage.removeEventListener('sync-req-done', handleSyncReqDone);
                remoteStorage.removeEventListener('sync-done', handleSyncDone);
                remoteStorage.removeEventListener('conflict', handleConflict);
                remoteStorage.removeEventListener('error', handleError);
            }
        };
    }, []); // AIDEV-NOTE: Empty deps to execute only once

    const value = {
        isConnected,
        isSyncing,
        lastSyncTime,
        syncStats,
        conflictMessage,
        forceSync,
        enableAutoSync,
        disableAutoSync,
        canSync
    };

    return (
        <RemoteStorageContext.Provider value={value}>
            {children}
        </RemoteStorageContext.Provider>
    );
};
