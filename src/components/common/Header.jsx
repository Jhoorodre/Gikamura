// AIDEV-NOTE: Main application header with traditional navigation structure
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useRemoteStorageContext } from '../../context/RemoteStorageContext';
import { ChevronDownIcon } from './Icones';

const Header = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { isConnected } = useRemoteStorageContext() || { isConnected: false };
    const location = useLocation();

    // AIDEV-NOTE: Navigation items with RemoteStorage dependency logic
    const navigationItems = [
        { 
            path: '/', 
            label: 'Hub Loader', 
            icon: '🔗',
            requiresConnection: false,
            description: 'Carregar novos hubs'
        },
        { 
            path: '/collection', 
            label: 'Coleção', 
            icon: '📚',
            requiresConnection: true,
            description: 'Seus itens salvos e histórico'
        },
        { 
            path: '/works', 
            label: 'Obras', 
            icon: '⭐',
            requiresConnection: true,
            description: 'Suas obras favoritas'
        },
        { 
            path: '/upload', 
            label: 'Upload', 
            icon: '📤',
            requiresConnection: true,
            description: 'Enviar conteúdo'
        }
    ];

    // AIDEV-NOTE: Filter items based on RemoteStorage connection status
    const visibleItems = navigationItems.filter(item => 
        !item.requiresConnection || isConnected
    );

    const isActiveRoute = (path) => location.pathname === path;

    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

    // AIDEV-NOTE: Hide header in reading pages to avoid conflicts
    const isReadingPage = location.pathname.includes('/read/') || 
                         location.pathname.includes('/reader/') || 
                         location.pathname.includes('/series/');
    
    if (isReadingPage) {
        return null;
    }

    // AIDEV-NOTE: Hide entire header when not connected to RemoteStorage
    // This removes the red header bar completely from the UI when no RemoteStorage
    if (!isConnected) {
        return null;
    }

    return (
        <header className="app-header">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* AIDEV-NOTE: Brand/Logo area - click to return to hub loader */}
                    <div className="flex items-center">
                        <Link 
                            to="/" 
                            className="text-2xl font-bold text-accent orbitron"
                            title="Voltar ao Hub Loader para carregar novos hubs"
                        >
                            Gikamoe
                        </Link>
                    </div>

                    {/* AIDEV-NOTE: Desktop navigation */}
                    <nav className="hidden md:flex items-center space-x-1">
                        {visibleItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                    isActiveRoute(item.path)
                                        ? 'bg-surface-hover text-accent font-medium border border-border-subtle'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                                }`}
                                title={item.description}
                            >
                                <span className="text-sm">{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* AIDEV-NOTE: Mobile dropdown navigation */}
                    <div className="md:hidden relative">
                        <button
                            onClick={toggleDropdown}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-hover text-accent border border-border"
                            aria-expanded={isDropdownOpen}
                            aria-label="Menu de navegação"
                        >
                            <span>Menu</span>
                            <ChevronDownIcon className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* AIDEV-NOTE: Mobile dropdown menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-lg shadow-lg z-50">
                                <div className="py-2">
                                    {visibleItems.map((item) => (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setIsDropdownOpen(false)}
                                            className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                                                isActiveRoute(item.path)
                                                    ? 'bg-surface-hover text-accent'
                                                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                                            }`}
                                        >
                                            <span className="text-lg mt-0.5">{item.icon}</span>
                                            <div className="flex-1">
                                                <div className="font-medium">{item.label}</div>
                                                <div className="text-sm text-text-tertiary">{item.description}</div>
                                            </div>
                                        </Link>
                                    ))}
                                    
                                    {/* AIDEV-NOTE: Connection status indicator in mobile menu */}
                                    <div className="px-4 py-2 border-t border-border mt-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-warning'}`}></div>
                                            <span className="text-text-secondary">
                                                {isConnected ? 'RemoteStorage Conectado' : 'Modo Local'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
