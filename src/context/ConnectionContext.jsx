import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { remoteStorage } from '../services/remotestorage';
import { APP_CONFIG } from '../constants/app';

const ConnectionContext = createContext();

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
};

export const ConnectionProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(remoteStorage.connected);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const [conflictMessage, setConflictMessage] = useState(null);

  // Handlers memoizados para performance
  const handleConnectionChange = useCallback(() => {
    setIsConnected(remoteStorage.connected);
  }, []);

  const handleSyncReqDone = useCallback(() => {
    setIsSyncing(true);
  }, []);

  const handleSyncDone = useCallback(() => {
    setIsSyncing(false);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOffline(true);
  }, []);

  const handleOnline = useCallback(() => {
    setIsOffline(false);
  }, []);

  const handleConflict = useCallback((conflictEvent) => {
    const message = conflictEvent && conflictEvent.path
      ? `Conflito de dados em "${conflictEvent.path}". A versão mais recente foi aplicada para manter tudo sincronizado.`
      : "Conflito de dados detectado. A versão mais recente foi aplicada.";
    
    setConflictMessage(message);
    setTimeout(() => setConflictMessage(null), APP_CONFIG.CONFLICT_MESSAGE_TIMEOUT);
  }, []);

  // Effect para gerenciar event listeners
  useEffect(() => {
    // Remote Storage events
    remoteStorage.on('connected', handleConnectionChange);
    remoteStorage.on('disconnected', handleConnectionChange);
    remoteStorage.on('sync-req-done', handleSyncReqDone);
    remoteStorage.on('sync-done', handleSyncDone);
    remoteStorage.on('conflict', handleConflict);
    
    // Network events
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      // Cleanup
      remoteStorage.removeEventListener('connected', handleConnectionChange);
      remoteStorage.removeEventListener('disconnected', handleConnectionChange);
      remoteStorage.removeEventListener('sync-req-done', handleSyncReqDone);
      remoteStorage.removeEventListener('sync-done', handleSyncDone);
      remoteStorage.removeEventListener('conflict', handleConflict);
      
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [handleConnectionChange, handleSyncReqDone, handleSyncDone, handleConflict, handleOffline, handleOnline]);

  const contextValue = useMemo(() => ({
    isConnected,
    isSyncing,
    isOffline,
    conflictMessage
  }), [isConnected, isSyncing, isOffline, conflictMessage]);

  return (
    <ConnectionContext.Provider value={contextValue}>
      {children}
    </ConnectionContext.Provider>
  );
};
