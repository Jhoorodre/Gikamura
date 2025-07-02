import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { remoteStorage } from '../services/remotestorage';

const RemoteStorageContext = createContext();

// Variáveis globais para controlar estado entre re-renders do Strict Mode
let globalListenersSetup = false;
let globalAutoSyncInterval = null;

export const useRemoteStorageContext = () => useContext(RemoteStorageContext);

export const RemoteStorageProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [syncStats, setSyncStats] = useState({ success: 0, errors: 0 });
    const [conflictMessage, setConflictMessage] = useState(null);

    // Refs para controle de intervalos e estado
    const autoSyncIntervalRef = useRef(null);
    const lastSyncAttemptRef = useRef(0);
    const listenersSetupRef = useRef(false);
    const isCleaningUpRef = useRef(false);

    // Constantes de controle
    const SYNC_COOLDOWN = 15000; // 15 segundos entre syncs
    const AUTO_SYNC_INTERVAL = 60000; // 1 minuto para auto-sync

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

    const forceSync = useCallback(async () => {
        if (!canSync()) {
            return false;
        }

        console.log('🔄 Iniciando sincronização forçada...');
        lastSyncAttemptRef.current = Date.now();
        
        try {
            // Usar sync() ao invés da função inexistente
            await remoteStorage.sync();
            console.log('✅ Sincronização manual concluída');
            return true;
        } catch (error) {
            console.error('❌ Erro ao forçar sincronização:', error);
            setSyncStats(prev => ({ ...prev, errors: prev.errors + 1 }));
            return false;
        }
    }, [canSync]);

    const enableAutoSync = useCallback(() => {
        // Previne múltiplos intervalos usando variável global
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

    useEffect(() => {
        // Previne configuração dupla de listeners usando variável global
        if (globalListenersSetup) {
            console.log('⚠️ Listeners já configurados globalmente, pulando...');
            return;
        }

        console.log('🔗 Configurando event listeners do RemoteStorage...');
        globalListenersSetup = true;
        listenersSetupRef.current = true;
        isCleaningUpRef.current = false;
        
        // Event listeners
        const handleConnected = () => {
            console.log('🔌 RemoteStorage conectado');
            setIsConnected(true);
            setLastSyncTime(new Date());
            // Ativa auto-sync com delay para evitar execução imediata e múltipla
            setTimeout(() => {
                if (!isCleaningUpRef.current && !autoSyncIntervalRef.current) {
                    enableAutoSync();
                }
            }, 10000); // 10 segundos de delay
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

        const handleConflict = (event) => {
            console.warn('⚠️ Conflito de sincronização detectado:', event);
            const message = event?.path 
                ? `Conflito em "${event.path}". Versão mais recente aplicada.`
                : 'Conflito de dados detectado. Versão mais recente aplicada.';
            setConflictMessage(message);
            
            // Remove mensagem após 8 segundos
            setTimeout(() => setConflictMessage(null), 8000);
        };

        const handleError = (error) => {
            console.error('❌ Erro do RemoteStorage:', error);
            setIsSyncing(false);
            setSyncStats(prev => ({ ...prev, errors: prev.errors + 1 }));
        };

        // Adicionar listeners
        remoteStorage.on('connected', handleConnected);
        remoteStorage.on('disconnected', handleDisconnected);
        remoteStorage.on('sync-req-done', handleSyncReqDone);
        remoteStorage.on('sync-done', handleSyncDone);
        remoteStorage.on('conflict', handleConflict);
        remoteStorage.on('error', handleError);

        // Estado inicial
        setIsConnected(remoteStorage.connected);

        // Se já está conectado, ativa auto-sync após delay maior
        if (remoteStorage.connected) {
            setTimeout(() => {
                if (!isCleaningUpRef.current && !autoSyncIntervalRef.current) {
                    enableAutoSync();
                }
            }, 10000); // 10 segundos de delay para evitar execução múltipla
        }

        return () => {
            console.log('🧹 Limpando RemoteStorage listeners e intervalos...');
            isCleaningUpRef.current = true;
            
            // Cleanup auto-sync
            disableAutoSync();
            
            // Só remove listeners se for a última instância
            if (globalListenersSetup) {
                globalListenersSetup = false;
                listenersSetupRef.current = false;
                
                // Cleanup listeners
                remoteStorage.removeEventListener('connected', handleConnected);
                remoteStorage.removeEventListener('disconnected', handleDisconnected);
                remoteStorage.removeEventListener('sync-req-done', handleSyncReqDone);
                remoteStorage.removeEventListener('sync-done', handleSyncDone);
                remoteStorage.removeEventListener('conflict', handleConflict);
                remoteStorage.removeEventListener('error', handleError);
            }
        };
    }, []); // Dependencies vazias para executar apenas uma vez

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
