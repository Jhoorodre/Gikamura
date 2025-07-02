import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useRemoteStorageContext } from '../../context/RemoteStorageContext';

const Navigation = () => {
    const [isOpen, setIsOpen] = useState(false);
    const remoteStorageContext = useRemoteStorageContext();
    const { isConnected } = remoteStorageContext || { isConnected: false };
    const location = useLocation();

    const toggleMenu = () => setIsOpen(!isOpen);
    const isActiveRoute = (route) => location.pathname === route;

    const menuItems = [
        { path: '/', label: 'Hub', icon: '⌂', requiresConnection: false },
        { path: '/collection', label: 'Coleção', icon: '⧉', requiresConnection: true },
        { path: '/works', label: 'Obras', icon: '★', requiresConnection: true },
        { path: '/upload', label: 'Upload', icon: '⇧', requiresConnection: true },
    ];
    const visibleItems = menuItems.filter(item => !item.requiresConnection || isConnected);
    if (!isConnected) return null;

    return (
        <>
            {/* Botão hamburguer minimalista */}
            <button
                onClick={toggleMenu}
                className="fixed top-4 left-4 z-50 p-2 bg-primary border border-secondary rounded-lg focus:outline-none focus-visible:ring"
                aria-label="Abrir menu de navegação"
            >
                <span className="block w-6 h-0.5 bg-accent mb-1 rounded"></span>
                <span className="block w-6 h-0.5 bg-accent mb-1 rounded"></span>
                <span className="block w-6 h-0.5 bg-accent rounded"></span>
            </button>

            {/* Menu lateral minimalista */}
            <nav className={`fixed left-0 top-0 h-full w-64 bg-primary border-r border-secondary transition-transform duration-200 z-40 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
                aria-label="Menu de navegação"
                tabIndex={-1}
            >
                <div className="flex flex-col h-full p-6">
                    <div className="mb-8 flex items-center justify-between">
                        <span className="text-xl font-bold text-accent">Menu</span>
                        <button
                            onClick={toggleMenu}
                            className="p-1 text-accent bg-transparent border-none focus:outline-none focus-visible:ring"
                            aria-label="Fechar menu"
                        >
                            ×
                        </button>
                    </div>
                    <ul className="flex-1 flex flex-col gap-2">
                        {visibleItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    onClick={toggleMenu}
                                    className={`flex items-center gap-3 px-4 py-2 rounded-lg text-accent hover:bg-secondary focus:bg-secondary transition-colors outline-none ${isActiveRoute(item.path) ? 'bg-secondary font-semibold' : ''}`}
                                    aria-current={isActiveRoute(item.path) ? 'page' : undefined}
                                >
                                    <span className="text-lg" aria-hidden="true">{item.icon}</span>
                                    <span className="text-base">{item.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>
        </>
    );
};

export default Navigation;
