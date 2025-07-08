// AIDEV-NOTE: Header simplificado - abas desktop, dropdown mobile
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useRemoteStorageContext } from '../../context/RemoteStorageContext';
import { useHubContext } from '../../context/HubContext';
import { encodeUrl } from '../../utils/encoding';

const Header = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef(null);
    
    const { isConnected } = useRemoteStorageContext() || { isConnected: false };
    const { currentHubData, currentHubUrl, lastAttemptedUrl, clearHubData } = useHubContext() || { 
        currentHubData: null, 
        currentHubUrl: null, 
        lastAttemptedUrl: null,
        clearHubData: () => {} 
    };
    
    const location = useLocation();
    const navigate = useNavigate();

    // AIDEV-NOTE: Navigation items configuration
    const navigationItems = [
        {
            label: 'Inicio',
            path: '/',
            requiresConnection: false,
            description: 'Voltar para a pagina inicial'
        },
        {
            path: '/collection',
            label: 'Colecao',
            requiresConnection: true,
            description: 'Seus itens salvos e historico'
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
            description: 'Enviar conteudo'
        }
    ];

    // AIDEV-NOTE: Filter items based on RemoteStorage connection
    const visibleItems = navigationItems.filter(item => 
        !item.requiresConnection || isConnected
    );

    // AIDEV-NOTE: Close mobile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setIsMobileMenuOpen(false);
            }
        };

        if (isMobileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isMobileMenuOpen]);

    // AIDEV-NOTE: Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const isActiveRoute = (path) => location.pathname === path;

    // AIDEV-NOTE: Logo navigation - always clear hub data when going to home
    const handleLogoClick = (e) => {
        e.preventDefault();
        
        // Always clear hub data when going to home
        clearHubData();
        
        // Navigate to home
        navigate('/');
    };

    // AIDEV-NOTE: Hide header in reading pages
    const isReadingPage = location.pathname.includes('/read/') || 
                         location.pathname.includes('/reader/') || 
                         location.pathname.includes('/series/');
    
    if (isReadingPage) {
        return null;
    }

    // AIDEV-NOTE: Show header when viewing hubs
    const isHubPage = location.pathname.includes('/hub/');
    
    if (!isConnected && !isHubPage) {
        return null;
    }

    return (
        <header className="app-header">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    
                    {/* Logo */}
                    <div className="flex items-center">
                        <button
                            onClick={handleLogoClick}
                            className="text-2xl font-bold text-accent orbitron hover:text-accent-hover transition-colors cursor-pointer"
                            title="Voltar ao Hub Loader"
                        >
                            Gikamura
                        </button>
                    </div>

                    {/* Desktop Navigation - Abas lado a lado */}
                    <nav className="desktop-nav">
                        {visibleItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`
                                    px-4 py-2 rounded-lg font-medium transition-all duration-200
                                    ${isActiveRoute(item.path)
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                                    }
                                `}
                                title={item.description}
                                onClick={item.path === '/' ? () => clearHubData() : undefined}
                            >
                                {item.label}
                            </Link>
                        ))}
                        
                        
                        {/* Status de conexao no desktop */}
                        <div className="ml-2 flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-warning'}`}></div>
                            <span className="text-xs text-text-secondary">
                                {isConnected ? 'Conectado' : 'Local'}
                            </span>
                        </div>
                    </nav>

                    {/* Mobile Navigation - Dropdown apenas */}
                    <div className="mobile-nav">
                        
                        <div className="relative" ref={mobileMenuRef}>
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="flex items-center justify-center w-10 h-10 rounded-lg bg-surface border border-border hover:bg-surface-hover transition-colors"
                                aria-expanded={isMobileMenuOpen}
                                aria-label="Menu de navegacao"
                            >
                                <svg 
                                    className={`w-5 h-5 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-90' : ''}`}
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    {isMobileMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>

                            {/* Mobile Menu Dropdown */}
                            {isMobileMenuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-lg shadow-lg z-50">
                                    <div className="py-2">
                                        {visibleItems.map((item) => (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                className={`
                                                    block px-4 py-3 transition-colors
                                                    ${isActiveRoute(item.path)
                                                        ? 'bg-primary text-white'
                                                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                                                    }
                                                `}
                                                onClick={item.path === '/' ? () => clearHubData() : undefined}
                                            >
                                                <div className="font-medium">{item.label}</div>
                                                <div className="text-xs opacity-75">{item.description}</div>
                                            </Link>
                                        ))}
                                        
                                        {/* Connection Status in Mobile */}
                                        <div className="px-4 py-3 border-t border-border mt-2">
                                            <div className="flex items-center space-x-2 text-sm">
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
            </div>
        </header>
    );
};

export default Header;