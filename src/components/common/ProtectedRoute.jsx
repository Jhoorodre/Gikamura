import { useRemoteStorageContext } from '../../context/RemoteStorageContext';

const ProtectedRoute = ({ children, fallback = null }) => {
    const { isConnected } = useRemoteStorageContext();
    
    // AIDEV-NOTE: Debug do status de conexão
    if (import.meta.env?.DEV) {
        console.log('🔒 [ProtectedRoute] Status de conexão:', {
            isConnected,
            willBlockAccess: !isConnected
        });
    }

    if (!isConnected) {
        if (import.meta.env?.DEV) {
            console.log('🔒 [ProtectedRoute] Bloqueando acesso - RemoteStorage não conectado');
        }
        return fallback || (
            <div className="fade-in text-center py-16">
                <div className="text-6xl mb-4">🔒</div>
                <h1 className="text-3xl orbitron mb-4">Acesso Restrito</h1>
                <p className="text-text-secondary mb-4">
                    Esta funcionalidade requer conexão com Remote Storage.
                </p>
                <p className="text-text-tertiary">
                    Conecte-se através do menu de navegação para acessar todas as funcionalidades.
                </p>
            </div>
        );
    }

    if (import.meta.env?.DEV) {
        console.log('🔒 [ProtectedRoute] Acesso liberado - RemoteStorage conectado');
    }

    return children;
};

export default ProtectedRoute;
