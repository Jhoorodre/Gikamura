import { useRemoteStorageContext } from '../../context/RemoteStorageContext';

const ProtectedRoute = ({ children, fallback = null }) => {
    const { isConnected } = useRemoteStorageContext();

    if (!isConnected) {
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

    return children;
};

export default ProtectedRoute;
