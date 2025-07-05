// AIDEV-NOTE: Main application header with design system integration
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRemoteStorageContext } from '../../context/RemoteStorageContext';
import { useAppContext } from '../../context/AppContext';
import { encodeUrl } from '../../utils/encoding';
import ThemeToggle from './ThemeToggle';

const Header = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { isConnected } = useRemoteStorageContext() || { isConnected: false };
    const { currentHubData, currentHubUrl, clearHubData } = useAppContext() || { currentHubData: null, currentHubUrl: null, clearHubData: () => {} };
    const location = useLocation();
    const navigate = useNavigate();

    // AIDEV-NOTE: Smart navigation for Hub Loader button
    const handleHubLoaderClick = (e) => {
        e.preventDefault();
        
        if (currentHubData && currentHubUrl) {
            // AIDEV-NOTE: Navigate to current loaded hub (never exposes raw/json URL)
            const encodedHubUrl = encodeUrl(currentHubUrl);
            navigate(`/hub/${encodedHubUrl}`);
        } else {
            // AIDEV-NOTE: No hub loaded, go to Hub Loader
            navigate('/');
        }
    };

    // AIDEV-NOTE: Navigation items with RemoteStorage dependency logic
    const navigationItems = [
        { 
            path: '/', 
            label: 'Hub Loader', 
            requiresConnection: false,
            description: 'Carregar novos hubs',
            onClick: handleHubLoaderClick
        },
        { 
            path: '/collection', 
            label: 'Coleção', 
            requiresConnection: true,
            description: 'Seus itens salvos e histórico'
        },
        { 
            path: '/works', 
            label: 'Obras', 
            requiresConnection: true,
            description: 'Suas obras favoritas'
        },
        { 
            path: '/upload', 
            label: 'Upload', 
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

    // AIDEV-NOTE: Logo navigation - clears hub data and goes to Hub Loader (/)
    const handleLogoClick = (e) => {
        e.preventDefault();
        clearHubData(); // AIDEV-NOTE: Clear hub data to force showing Hub Loader placeholder
        navigate('/');
    };

    // AIDEV-NOTE: Hide header in reading pages to avoid conflicts
    const isReadingPage = location.pathname.includes('/read/') || 
                         location.pathname.includes('/reader/') || 
                         location.pathname.includes('/series/');
    
    if (isReadingPage) {
        return null;
    }

    // AIDEV-NOTE: Show header when viewing hubs, regardless of RemoteStorage connection
    const isHubPage = location.pathname.includes('/hub/');
    
    // AIDEV-NOTE: Hide header only when not connected AND not viewing a hub
    if (!isConnected && !isHubPage) {
        return null;
    }

    return (
        <header className="app-header">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* AIDEV-NOTE: Brand/Logo area - smart navigation to hub or loader */}
                    <div className="flex items-center">
                        <button
                            onClick={handleLogoClick}
                            className="text-2xl font-bold text-accent orbitron hover:text-accent-hover transition-colors cursor-pointer"
                            title="Voltar ao Hub Loader"
                        >
                            Gikamoe
                        </button>
                    </div>

                    {/* AIDEV-NOTE: Desktop navigation with design system */}
                    <nav className="hidden md:flex items-center space-x-1">
                        {visibleItems.map((item) => (
                            item.onClick ? (
                                <button
                                    key={item.path}
                                    onClick={item.onClick}
                                    className={`px-md py-sm rounded-lg transition-all duration-300 ${
                                        isActiveRoute(item.path)
                                            ? 'bg-primary text-inverse font-medium border border-border-focus'
                                            : 'text-secondary hover:text-primary hover:bg-surface'
                                    }`}
                                    title={item.description}
                                >
                                    {item.label}
                                </button>
                            ) : (
                                <a
                                    key={item.path}
                                    href={item.path}
                                    className={`px-md py-sm rounded-lg transition-all duration-300 ${
                                        isActiveRoute(item.path)
                                            ? 'bg-primary text-inverse font-medium border border-border-focus'
                                            : 'text-secondary hover:text-primary hover:bg-surface'
                                    }`}
                                    title={item.description}
                                >
                                    {item.label}
                                </a>
                            )
                        ))}
                        
                        {/* AIDEV-NOTE: Theme toggle in desktop navigation */}
                        <div className="ml-md">
                            <ThemeToggle size="sm" />
                        </div>
                    </nav>

                    {/* AIDEV-NOTE: Mobile dropdown navigation with design system */}
                    <div className="md:hidden relative flex items-center gap-sm">
                        <ThemeToggle size="sm" />
                        
                        <button
                            onClick={toggleDropdown}
                            className="flex items-center gap-2 px-md py-sm rounded-lg bg-surface text-accent border border-border transition-all duration-300"
                            aria-expanded={isDropdownOpen}
                            aria-label="Menu de navegação"
                        >
                            <span>Menu</span>
                            <span className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                        </button>

                        {/* AIDEV-NOTE: Mobile dropdown menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-lg shadow-lg z-50">
                                <div className="py-2">
                                    {visibleItems.map((item) => (
                                        item.onClick ? (
                                            <button
                                                key={item.path}
                                                onClick={() => {
                                                    item.onClick();
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`px-4 py-3 transition-colors w-full text-left ${
                                                    isActiveRoute(item.path)
                                                        ? 'bg-surface-hover text-accent'
                                                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                                                }`}
                                            >
                                                    <div className="font-medium">{item.label}</div>
                                                    <div className="text-sm text-text-tertiary">{item.description}</div>
                                            </button>
                                        ) : (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                onClick={() => setIsDropdownOpen(false)}
                                                className={`px-4 py-3 transition-colors ${
                                                    isActiveRoute(item.path)
                                                        ? 'bg-surface-hover text-accent'
                                                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                                                }`}
                                            >
                                                    <div className="font-medium">{item.label}</div>
                                                    <div className="text-sm text-text-tertiary">{item.description}</div>
                                            </Link>
                                        )
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
