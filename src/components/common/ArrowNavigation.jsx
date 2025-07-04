import { useNavigate, useLocation } from 'react-router-dom';
import { useRemoteStorageContext } from '../../context/RemoteStorageContext';
import { useEffect, useState } from 'react';

const ArrowNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isConnected } = useRemoteStorageContext() || {};
    const [shouldRender, setShouldRender] = useState(true);

    // AIDEV-NOTE: Use effect to ensure route checking happens after navigation
    useEffect(() => {
        const isReaderPage = location.pathname.includes('/read/') || 
                            location.pathname.includes('/reader/') ||
                            location.pathname.includes('/series/');

        if (isReaderPage) {
            console.log('🔍 [ArrowNavigation] Hiding navigation for reader page:', location.pathname);
            setShouldRender(false);
        } else {
            setShouldRender(true);
        }
    }, [location.pathname]);

    // AIDEV-NOTE: Early return if should not render
    if (!shouldRender) {
        return null;
    }

    const routes = [
        { path: '/', requiresConnection: false },
        { path: '/collection', requiresConnection: true },
        { path: '/works', requiresConnection: true },
        { path: '/upload', requiresConnection: true },
    ];

    const availableRoutes = routes.filter(route => 
        !route.requiresConnection || isConnected
    );
    
    const currentIndex = availableRoutes.findIndex(route => 
        route.path === location.pathname
    );

    if (availableRoutes.length <= 1) return null;

    const handleNavigation = (direction) => {
        const nextIndex = direction === 'next' 
            ? (currentIndex + 1) % availableRoutes.length
            : currentIndex === 0 
                ? availableRoutes.length - 1 
                : currentIndex - 1;
        
        navigate(availableRoutes[nextIndex].path);
    };

    const NavButton = ({ direction, icon, label }) => (
        <button
            onClick={() => handleNavigation(direction)}
            className="group relative p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:from-blue-600 focus:to-purple-700 focus:outline-none transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl"
            aria-label={label}
        >
            <svg 
                className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-110" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                strokeWidth={2.5}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
            </svg>
            
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-md -z-10 scale-150"></div>
        </button>
    );

    const ProgressDots = () => (
        <div className="flex items-center gap-2">
            {availableRoutes.map((_, index) => (
                <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentIndex 
                            ? 'bg-blue-500 scale-125 shadow-lg shadow-blue-500/50' 
                            : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                />
            ))}
        </div>
    );

    return (
        <nav 
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50" 
            role="navigation"
        >
            {/* Main container with glassmorphism */}
            <div className="flex items-center gap-6 px-6 py-4 rounded-2xl backdrop-blur-xl bg-white/90 border border-gray-200/50 shadow-2xl shadow-black/10">
                
                {/* Left arrow */}
                <NavButton 
                    direction="prev" 
                    icon="M15 19l-7-7 7-7" 
                    label="Página anterior" 
                />
                
                {/* Progress indicator */}
                <div className="px-4">
                    <ProgressDots />
                </div>
                
                {/* Right arrow */}
                <NavButton 
                    direction="next" 
                    icon="M9 5l7 7-7 7" 
                    label="Próxima página" 
                />
            </div>
            
            {/* Subtle bottom glow */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-4 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent blur-xl"></div>
        </nav>
    );
};

export default ArrowNavigation;