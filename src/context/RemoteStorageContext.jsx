// AIDEV-NOTE: RemoteStorage connection and sync management with anti-leak protection
import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { remoteStorage } from '../services/remotestorage';

const RemoteStorageContext = createContext();

// AIDEV-NOTE: Global var to control auto-sync interval between re-renders
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
    const lastCleanupAttemptRef = useRef(0);
    const isCleaningUpRef = useRef(false);
    const syncTimeoutRef = useRef(null);

    // AIDEV-NOTE: Control constants to prevent spam
    const SYNC_COOLDOWN = 30000; // 30 seconds between syncs (increased from 15)
    const AUTO_SYNC_INTERVAL = 300000; // 5 minutes for auto-sync (increased to reduce frequency)
    const CLEANUP_COOLDOWN = 60000; // 1 minute between cleanup operations

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

    // AIDEV-NOTE: Fixed interval management to prevent memory leaks
    const enableAutoSync = useCallback(() => {
        // Clear any existing interval before creating new one
        if (autoSyncIntervalRef.current) {
            clearInterval(autoSyncIntervalRef.current);
            autoSyncIntervalRef.current = null;
        }
        
        if (globalAutoSyncInterval) {
            clearInterval(globalAutoSyncInterval);
            globalAutoSyncInterval = null;
        }

        console.log('🔄 Ativando auto-sync com intervalo de 5 minutos');
        
        const intervalId = setInterval(() => {
            if (canSync()) {
                console.log('🔄 Auto-sync: executando sincronização automática');
                forceSync();
            } else {
                console.log('🔄 Auto-sync: pulando sincronização (cooldown ativo ou sincronizando)');
            }
        }, AUTO_SYNC_INTERVAL);
        
        globalAutoSyncInterval = intervalId;
        autoSyncIntervalRef.current = intervalId;
    }, [canSync, forceSync]);

    const disableAutoSync = useCallback(() => {
        if (autoSyncIntervalRef.current) {
            clearInterval(autoSyncIntervalRef.current);
            autoSyncIntervalRef.current = null;
        }
        
        if (globalAutoSyncInterval) {
            clearInterval(globalAutoSyncInterval);
            globalAutoSyncInterval = null;
        }
        
        console.log('⏹️ Auto-sync desativado');
    }, []);

    // AIDEV-NOTE: Fixed memory leak by properly managing event listeners
    useEffect(() => {
        console.log('🔗 Configurando event listeners do RemoteStorage...');
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
            
            // AIDEV-NOTE: Auto-timeout to prevent persistent sync overlay (safety net)
            // Clear any existing timeout first
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
            
            syncTimeoutRef.current = setTimeout(() => {
                console.log('⏰ Timeout de sync - forçando isSyncing = false');
                setIsSyncing(false);
                syncTimeoutRef.current = null;
            }, 20000); // 20 segundos timeout (reduzido)
        };

        const handleSyncDone = async () => {
            console.log('✅ Sync concluído - setIsSyncing(false)');
            setIsSyncing(false);
            setLastSyncTime(new Date());
            setSyncStats(prev => ({ ...prev, success: prev.success + 1 }));
            
            // AIDEV-NOTE: Clear sync timeout since sync completed successfully
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
                syncTimeoutRef.current = null;
            }
            
            // AIDEV-NOTE: Trigger automatic cleanup after sync completion with throttling
            const now = Date.now();
            const timeSinceLastCleanup = now - lastCleanupAttemptRef.current;
            
            if (timeSinceLastCleanup >= CLEANUP_COOLDOWN) {
                lastCleanupAttemptRef.current = now;
                
                try {
                    const { cleanCorruptedRemoteStorageData } = await import('../services/api.js');
                    setTimeout(async () => {
                        try {
                            console.log('🧹 [RemoteStorage] Iniciando limpeza automática pós-sync...');
                            const cleaned = await cleanCorruptedRemoteStorageData();
                            if (cleaned) {
                                console.log('🧹 [RemoteStorage] Limpeza automática pós-sync concluída com sucesso');
                            } else {
                                console.log('✨ [RemoteStorage] Limpeza automática: nenhum dado corrompido encontrado');
                            }
                        } catch (error) {
                            console.error('❌ [RemoteStorage] Erro na limpeza automática pós-sync:', error);
                        }
                    }, 2000); // 2 second delay to ensure sync is fully complete
                } catch (error) {
                    console.error('❌ [RemoteStorage] Erro ao importar função de limpeza:', error);
                }
            } else {
                const waitTime = Math.ceil((CLEANUP_COOLDOWN - timeSinceLastCleanup) / 1000);
                console.log(`⏳ [RemoteStorage] Limpeza automática em cooldown (${waitTime}s restantes)`);
            }
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
            console.error('❌ Erro do RemoteStorage - setIsSyncing(false):', error);
            setIsSyncing(false);
            setSyncStats(prev => ({ ...prev, errors: prev.errors + 1 }));
            
            // AIDEV-NOTE: Clear sync timeout on error
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
                syncTimeoutRef.current = null;
            }
        };

        // AIDEV-NOTE: Store listeners in object for proper cleanup
        const listeners = {
            'connected': handleConnected,
            'disconnected': handleDisconnected,
            'sync-req-done': handleSyncReqDone,
            'sync-done': handleSyncDone,
            'conflict': handleConflict,
            'error': handleError
        };

        // AIDEV-NOTE: Add all RemoteStorage event listeners
        Object.entries(listeners).forEach(([event, handler]) => {
            remoteStorage.on(event, handler);
        });

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
            
            // AIDEV-NOTE: Clear sync timeout if running
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
                syncTimeoutRef.current = null;
            }
            
            // AIDEV-NOTE: Properly remove all event listeners
            Object.entries(listeners).forEach(([event, handler]) => {
                remoteStorage.off(event, handler);
            });
        };
    }, []); // AIDEV-NOTE: Empty deps to execute only once

    // AIDEV-NOTE: Watchdog effect to ensure isSyncing never gets stuck
    useEffect(() => {
        if (isSyncing) {
            console.log('🐕 [RemoteStorage] Watchdog: sync iniciado');
            
            // AIDEV-NOTE: Emergency timeout to force sync completion (longer than normal timeout)
            const emergencyTimeout = setTimeout(() => {
                console.warn('🚨 [RemoteStorage] WATCHDOG: Forçando isSyncing = false (timeout de emergência)');
                setIsSyncing(false);
                if (syncTimeoutRef.current) {
                    clearTimeout(syncTimeoutRef.current);
                    syncTimeoutRef.current = null;
                }
            }, 60000); // 60 segundos - timeout de emergência
            
            return () => {
                clearTimeout(emergencyTimeout);
            };
        }
    }, [isSyncing]);

    // AIDEV-NOTE: Memoize context value to prevent unnecessary re-renders
    const value = useMemo(() => ({
        isConnected,
        isSyncing,
        lastSyncTime,
        syncStats,
        conflictMessage,
        forceSync,
        enableAutoSync,
        disableAutoSync,
        canSync
    }), [
        isConnected,
        isSyncing,
        lastSyncTime,
        syncStats,
        conflictMessage,
        forceSync,
        enableAutoSync,
        disableAutoSync,
        canSync
    ]);

    return (
        <RemoteStorageContext.Provider value={value}>
            {children}
        </RemoteStorageContext.Provider>
    );
};
