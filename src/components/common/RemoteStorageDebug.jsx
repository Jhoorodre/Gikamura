import { useRemoteStorageContext } from '../../context/RemoteStorageContext';

const RemoteStorageDebug = () => {
    const { isConnected, isSyncing, conflictMessage } = useRemoteStorageContext();

    if (!isConnected) return null;

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '12px',
            zIndex: 10000,
            maxWidth: '300px'
        }}>
            <div><strong>RemoteStorage Debug</strong></div>
            <div>Status: {isConnected ? '✅ Conectado' : '❌ Desconectado'}</div>
            <div>Sincronizando: {isSyncing ? '🔄 Sim' : '✅ Não'}</div>
            {conflictMessage && (
                <div style={{ color: '#f59e0b' }}>⚠️ {conflictMessage}</div>
            )}
        </div>
    );
};

export default RemoteStorageDebug;
