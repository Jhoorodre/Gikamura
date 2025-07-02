import { useNavigate, useLocation } from 'react-router-dom';
import { useRemoteStorageContext } from '../../context/RemoteStorageContext';
import { useAppContext } from '../../context/AppContext';

const ArrowNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isConnected } = useRemoteStorageContext() || { isConnected: false };
    const { clearHubData } = useAppContext();
    
    // Definir as rotas disponíveis baseado na conexão
    const routes = [
        { path: '/', label: 'Hub', icon: '🏠', requiresConnection: false },
        { path: '/collection', label: 'Coleção', icon: '📚', requiresConnection: true },
        { path: '/works', label: 'Obras', icon: '⭐', requiresConnection: true },
        { path: '/upload', label: 'Upload', icon: '📤', requiresConnection: true },
    ];

    // Filtrar rotas baseado na conexão
    const availableRoutes = routes.filter(route => !route.requiresConnection || isConnected);
    
    // Debug log para verificar rotas disponíveis
    if (process.env.NODE_ENV === 'development') {
        console.log('🧭 [ArrowNavigation] Estado:', { 
            isConnected, 
            availableRoutes: availableRoutes.map(r => r.label),
            currentPath: location.pathname 
        });
    }
    
    // Encontrar índice da rota atual
    const currentIndex = availableRoutes.findIndex(route => route.path === location.pathname);
    
    // Função para navegar para a próxima página
    const navigateNext = () => {
        const nextIndex = (currentIndex + 1) % availableRoutes.length;
        navigate(availableRoutes[nextIndex].path);
    };
    
    // Função para navegar para a página anterior
    const navigatePrev = () => {
        const prevIndex = currentIndex - 1 < 0 ? availableRoutes.length - 1 : currentIndex - 1;
        navigate(availableRoutes[prevIndex].path);
    };

    // Não mostrar navegação em rotas específicas ou quando há apenas uma rota disponível
    const shouldShowNavigation = availableRoutes.length > 1 && 
        !location.pathname.startsWith('/hub/') &&
        !location.pathname.startsWith('/series/') &&
        !location.pathname.startsWith('/read/');

    if (!shouldShowNavigation) {
        return (
            <>
                {/* Botão de retorno para rotas internas */}
                {(location.pathname.startsWith('/hub/') || 
                  location.pathname.startsWith('/series/') || 
                  location.pathname.startsWith('/read/')) && (
                    <div className="fixed top-4 left-4 z-50">
                        <button
                            onClick={() => {
                                if (!isConnected && location.pathname.startsWith('/hub/')) {
                                    // Modo desconectado: limpa dados do hub e volta ao placeholder
                                    clearHubData();
                                    navigate('/');
                                } else {
                                    // Modo conectado ou outras rotas: volta uma página
                                    navigate(-1);
                                }
                            }}
                            className="bg-surface-secondary/90 backdrop-blur-sm p-3 rounded-xl shadow-lg hover:bg-accent hover:text-black transition-all duration-300 border border-surface-tertiary"
                            title={!isConnected && location.pathname.startsWith('/hub/') ? "Voltar ao Hub Loader" : "Voltar"}
                            aria-label={!isConnected && location.pathname.startsWith('/hub/') ? "Voltar ao Hub Loader" : "Voltar à página anterior"}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                    </div>
                )}
            </>
        );
    }

    const currentRoute = availableRoutes[currentIndex];
    const nextRoute = availableRoutes[(currentIndex + 1) % availableRoutes.length];
    const prevRoute = availableRoutes[currentIndex - 1 < 0 ? availableRoutes.length - 1 : currentIndex - 1];

    return (
        <>
            {/* Navegação por setas */}
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
                <div className="flex items-center gap-4 bg-surface-primary/90 backdrop-blur-sm p-3 rounded-2xl shadow-xl border border-surface-tertiary">
                    {/* Seta Esquerda */}
                    <button
                        onClick={navigatePrev}
                        className="p-3 bg-surface-secondary rounded-xl hover:bg-accent hover:text-black transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg"
                        title={`Ir para ${prevRoute.label}`}
                        aria-label={`Navegar para ${prevRoute.label}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* Indicador da página atual */}
                    <div className="flex items-center gap-3 px-4">
                        <span className="text-2xl">{currentRoute?.icon}</span>
                        <div className="text-center">
                            <div className="text-sm font-semibold text-accent">{currentRoute?.label}</div>
                            <div className="text-xs text-text-secondary">
                                {currentIndex + 1} de {availableRoutes.length}
                            </div>
                        </div>
                    </div>

                    {/* Seta Direita */}
                    <button
                        onClick={navigateNext}
                        className="p-3 bg-surface-secondary rounded-xl hover:bg-accent hover:text-black transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg"
                        title={`Ir para ${nextRoute.label}`}
                        aria-label={`Navegar para ${nextRoute.label}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Navegação rápida por pontos (opcional) */}
                <div className="flex justify-center mt-3 gap-2">
                    {availableRoutes.map((route, index) => (
                        <button
                            key={route.path}
                            onClick={() => navigate(route.path)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                index === currentIndex 
                                    ? 'bg-accent scale-125' 
                                    : 'bg-surface-tertiary hover:bg-accent/50'
                            }`}
                            title={route.label}
                            aria-label={`Ir para ${route.label}`}
                        />
                    ))}
                </div>
            </div>
        </>
    );
};

export default ArrowNavigation;
