import { createContext, useContext, useEffect, useState } from 'react';
import { remoteStorage } from '../services/remotestorage';

const RemoteStorageContext = createContext();

export const useRemoteStorageContext = () => useContext(RemoteStorageContext);

export const RemoteStorageProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(remoteStorage.connected);
  const [isSyncing, setIsSyncing] = useState(false);
  const [conflictMessage, setConflictMessage] = useState(null);

  useEffect(() => {
    const handleConnectionChange = () => setIsConnected(remoteStorage.connected);
    const handleSyncReqDone = () => setIsSyncing(true);
    const handleSyncDone = () => setIsSyncing(false);
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
    return () => {
      remoteStorage.removeEventListener('connected', handleConnectionChange);
      remoteStorage.removeEventListener('disconnected', handleConnectionChange);
      remoteStorage.removeEventListener('sync-req-done', handleSyncReqDone);
      remoteStorage.removeEventListener('sync-done', handleSyncDone);
      remoteStorage.removeEventListener('conflict', handleConflict);
    };
  }, []);

  return (
    <RemoteStorageContext.Provider value={{ isConnected, isSyncing, conflictMessage }}>
      {children}
    </RemoteStorageContext.Provider>
  );
};
