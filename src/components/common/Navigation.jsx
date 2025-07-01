import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useRemoteStorageContext } from '../../context/RemoteStorageContext';

const Navigation = () => {
    const [isOpen, setIsOpen] = useState(false);
    const remoteStorageContext = useRemoteStorageContext();
    const { isConnected } = remoteStorageContext || { isConnected: false };
    const location = useLocation();

    const toggleMenu = () => setIsOpen(!isOpen);

    const isActiveRoute = (route) => {
        return location.pathname === route;
    };

    const menuItems = [
        { path: '/', label: 'Hub', icon: '🏠', requiresConnection: false },
        { path: '/collection', label: 'Coleção', icon: '📚', requiresConnection: true },
        { path: '/works', label: 'Obras', icon: '⭐', requiresConnection: true },
        { path: '/upload', label: 'Upload', icon: '📤', requiresConnection: true },
    ];

    // Filtra itens baseado na conexão Remote Storage
    const visibleItems = menuItems.filter(item => !item.requiresConnection || isConnected);

    // Se não estiver conectado, não mostra o menu
    if (!isConnected) {
        return null;
    }

    return (
        <>
            {/* Botão hamburguer fixo */}
            <button
                onClick={toggleMenu}
                className="fixed top-4 left-4 z-50 p-3 bg-surface-secondary rounded-lg shadow-lg hover:bg-surface-tertiary transition-colors"
                aria-label="Menu"
            >
                <div className="flex flex-col w-5 h-4 justify-between">
                    <div className={`h-0.5 bg-text-primary transition-all ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
                    <div className={`h-0.5 bg-text-primary transition-all ${isOpen ? 'opacity-0' : ''}`}></div>
                    <div className={`h-0.5 bg-text-primary transition-all ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
                </div>
            </button>

            {/* Overlay */}
            {isOpen && (
                <div 
                    className="navigation-overlay fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={toggleMenu}
                />
            )}

            {/* Menu lateral */}
            <nav className={`navigation-menu fixed left-0 top-0 h-full w-80 shadow-2xl transform transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="navigation-header">
                    <h2 className="navigation-title text-2xl font-bold orbitron">Navegação</h2>
                </div>
                
                <ul className="navigation-list">
                    {visibleItems.map((item) => (
                        <li key={item.path} className="navigation-item">
                            <Link
                                to={item.path}
                                onClick={toggleMenu}
                                className={`navigation-link ${
                                    isActiveRoute(item.path) ? 'active' : ''
                                }`}
                            >
                                <span className="navigation-icon">{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="p-6 mt-auto">
                    {!isConnected && (
                        <div className="protected-route-warning">
                            <p className="text-sm text-warning mb-2 font-medium">
                                🔒 Acesso Limitado
                            </p>
                            <p className="text-xs text-text-secondary">
                                Conecte-se ao Remote Storage para acessar todas as funcionalidades.
                            </p>
                        </div>
                    )}

                    {isConnected && (
                        <div className="bg-success-alpha border border-success/20 rounded-lg p-4">
                            <p className="text-sm text-success font-medium mb-1">
                                ✅ Remote Storage Conectado
                            </p>
                            <p className="text-xs text-text-secondary">
                                Todas as funcionalidades disponíveis
                            </p>
                        </div>
                    )}
                </div>
            </nav>
        </>
    );
};

export default Navigation;
