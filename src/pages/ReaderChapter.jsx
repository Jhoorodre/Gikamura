// src/pages/ReaderChapter.jsx - Versão com Modo Scroll e Cache Otimizado
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReader } from '../hooks/useReader';
import useImageCache from '../hooks/useImageCache';
import { useHubContext } from '../context/HubContext';
import { decodeUrl, encodeUrl } from '../utils/encoding';
import { getHubUrl, getMangaUrl, getReaderUrl } from '../config/routes';
import Spinner from '../components/common/Spinner';
import CachedImage from '../components/common/CachedImage';
import { 
    ChevronLeftIcon, 
    ChevronRightIcon, 
    CogIcon,
    FullscreenIcon,
    ZoomInIcon,
    ZoomOutIcon,
    GridIcon,
    ViewColumnsIcon,
    EyeIcon,
    HomeIcon
} from '../components/common/Icones';

const ReaderChapter = () => {
    const { encodedUrl, encodedChapterId } = useParams();
    const navigate = useNavigate();
    const { readerData, loadReader } = useReader();
    const { currentHubData, currentHubUrl } = useHubContext();
    const { 
        getImage, 
        preloadChapterPages, 
        preloadChapter, 
        isImageCached, 
        getCacheStats,
        isPreloading 
    } = useImageCache();

    // Estados do leitor
    const [currentPage, setCurrentPage] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [showPageOverview, setShowPageOverview] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [viewMode, setViewMode] = useState('single'); // 'single' ou 'scroll'
    const [fitMode, setFitMode] = useState('original');
    const [showBackToTop, setShowBackToTop] = useState(false);
    
    // Define fitMode padrão baseado no viewMode
    useEffect(() => {
        if (viewMode === 'scroll') {
            setFitMode('original'); // Modo original como padrão no scroll
        }
    }, [viewMode]);
    
    // Refs
    const controlsTimeoutRef = useRef(null);
    const containerRef = useRef(null);
    const touchStartRef = useRef({ x: 0, y: 0 });

    // URLs decodificadas
    const readerUrl = useMemo(() => decodeUrl(encodedUrl), [encodedUrl]);
    const chapterId = useMemo(() => decodeUrl(encodedChapterId), [encodedChapterId]);

    // Carrega os dados da obra
    useEffect(() => {
        if (import.meta.env?.DEV) {
            console.log('📖 [ReaderChapter] useEffect loadReader:', {
                readerData: !!readerData,
                readerUrl,
                chapterId,
                willLoad: !readerData
            });
        }
        
        if (!readerData) {
            loadReader(readerUrl);
        }
    }, [readerData, readerUrl, loadReader]);

    // Páginas do capítulo atual
    const pages = useMemo(() => {
        const chapter = readerData?.chapters?.[chapterId];
        if (!chapter?.groups) return [];
        const firstGroupKey = Object.keys(chapter.groups)[0];
        return chapter.groups[firstGroupKey] || [];
    }, [readerData, chapterId]);

    // Informações de navegação entre capítulos
    const navigationInfo = useMemo(() => {
        if (!readerData?.chapters) return { prev: null, next: null, current: null, nextPages: [] };
        
        const chapterIds = Object.keys(readerData.chapters).sort((a, b) => {
            const numA = parseFloat(a);
            const numB = parseFloat(b);
            return !isNaN(numA) && !isNaN(numB) ? numA - numB : a.localeCompare(b);
        });
        
        const currentIndex = chapterIds.indexOf(chapterId);
        const nextChapterId = currentIndex < chapterIds.length - 1 ? chapterIds[currentIndex + 1] : null;
        
        // Páginas do próximo capítulo para pré-carregamento
        let nextPages = [];
        if (nextChapterId && readerData.chapters[nextChapterId]?.groups) {
            const firstGroupKey = Object.keys(readerData.chapters[nextChapterId].groups)[0];
            nextPages = readerData.chapters[nextChapterId].groups[firstGroupKey] || [];
        }
        
        return {
            prev: currentIndex > 0 ? chapterIds[currentIndex - 1] : null,
            next: nextChapterId,
            nextPages,
            current: {
                id: chapterId,
                index: currentIndex + 1,
                total: chapterIds.length,
                title: readerData.chapters[chapterId]?.title
            }
        };
    }, [readerData, chapterId]);

    // Salva progresso de leitura
    const saveReadingProgress = useCallback(() => {
        if (readerData?.title) {
            const progressKey = `reading-progress-${readerData.title}`;
            const currentProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');
            
            currentProgress[chapterId] = {
                lastPage: currentPage,
                totalPages: pages.length,
                completed: currentPage >= pages.length - 1,
                lastRead: new Date().toISOString()
            };
            
            localStorage.setItem(progressKey, JSON.stringify(currentProgress));
        }
    }, [readerData?.title, chapterId, currentPage, pages.length]);

    // Auto-save progresso
    useEffect(() => {
        const timer = setTimeout(saveReadingProgress, 1000);
        return () => clearTimeout(timer);
    }, [saveReadingProgress]);
    
    // Detecta scroll para mostrar botão voltar ao topo
    useEffect(() => {
        const handleScroll = () => {
            if (viewMode === 'scroll') {
                setShowBackToTop(window.scrollY > 200);
            }
        };
        
        if (viewMode === 'scroll') {
            // Verifica posição inicial
            handleScroll();
            window.addEventListener('scroll', handleScroll);
            return () => window.removeEventListener('scroll', handleScroll);
        } else {
            // Limpa estado quando não está no modo scroll
            setShowBackToTop(false);
        }
    }, [viewMode]);

    // Controles automáticos
    const resetControlsTimer = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        // No modo scroll, não ocultar controles automaticamente
        if (viewMode !== 'scroll') {
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 4000);
        }
    }, [viewMode]);

    const handleInteraction = useCallback((e) => {
        e.stopPropagation();
        resetControlsTimer();
    }, [resetControlsTimer]);

    // Navegação de páginas
    const goToNextPage = useCallback(() => {
        if (viewMode === 'scroll') return; // Não navegar no modo scroll
        
        if (currentPage < pages.length - 1) {
            setCurrentPage(prev => prev + 1);
        } else if (navigationInfo.next) {
            // Auto-navegar para próximo capítulo
            const encodedNext = encodeUrl(navigationInfo.next);
            navigate(getReaderUrl(encodedUrl, encodedNext));
        }
        resetControlsTimer();
    }, [currentPage, pages.length, navigationInfo.next, encodedUrl, navigate, resetControlsTimer, viewMode]);

    const goToPrevPage = useCallback(() => {
        if (viewMode === 'scroll') return; // Não navegar no modo scroll
        
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1);
        } else if (navigationInfo.prev) {
            // Auto-navegar para capítulo anterior
            const encodedPrev = encodeUrl(navigationInfo.prev);
            navigate(getReaderUrl(encodedUrl, encodedPrev));
        }
        resetControlsTimer();
    }, [currentPage, navigationInfo.prev, encodedUrl, navigate, resetControlsTimer, viewMode]);

    const goToPage = useCallback((pageIndex) => {
        setCurrentPage(Math.max(0, Math.min(pageIndex, pages.length - 1)));
        setShowPageOverview(false);
        resetControlsTimer();
    }, [pages.length, resetControlsTimer]);
    
    // Função para voltar ao topo
    const scrollToTop = useCallback(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Navegação por capítulos
    const goToChapter = useCallback((chapterIdToGo) => {
        const encodedChapter = encodeUrl(chapterIdToGo);
        navigate(getReaderUrl(encodedUrl, encodedChapter));
    }, [encodedUrl, navigate]);

    // Navegação inteligente de volta
    const handleBackNavigation = useCallback(() => {
        if (import.meta.env?.DEV) {
            console.log('📖 [ReaderChapter] handleBackNavigation chamado:', {
                currentHubData: !!currentHubData,
                currentHubUrl,
                encodedUrl
            });
        }
        
        // Se existe hub context, volta para o hub
        if (currentHubData && currentHubUrl) {
            const encodedHubUrl = encodeUrl(currentHubUrl);
            if (import.meta.env?.DEV) {
                console.log('📖 [ReaderChapter] Navegando para hub:', getHubUrl(encodedHubUrl));
            }
            navigate(getHubUrl(encodedHubUrl));
            return;
        }
        
        // Se não existe hub context, tenta ir para a página do manga
        try {
            if (import.meta.env?.DEV) {
                console.log('📖 [ReaderChapter] Navegando para manga:', getMangaUrl(encodedUrl));
            }
            navigate(getMangaUrl(encodedUrl));
        } catch (error) {
            // Se falhar, vai para a home
            if (import.meta.env?.DEV) {
                console.log('📖 [ReaderChapter] Navegando para home por erro:', error);
            }
            navigate('/');
        }
    }, [currentHubData, currentHubUrl, encodedUrl, navigate]);

    // Navegação para home (fallback)
    const handleHomeNavigation = useCallback(() => {
        navigate('/');
    }, [navigate]);

    // Controles de zoom
    const handleZoomIn = useCallback(() => {
        setZoomLevel(prev => Math.min(prev + 0.25, 3));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
    }, []);

    const resetZoom = useCallback(() => {
        setZoomLevel(1);
    }, []);

    // Tela cheia
    const toggleFullscreen = useCallback(async () => {
        if (!document.fullscreenElement) {
            try {
                await containerRef.current?.requestFullscreen();
                setIsFullscreen(true);
            } catch (err) {
                console.error('Erro ao entrar em tela cheia:', err);
            }
        } else {
            try {
                await document.exitFullscreen();
                setIsFullscreen(false);
            } catch (err) {
                console.error('Erro ao sair da tela cheia:', err);
            }
        }
    }, []);

    // Eventos de teclado
    useEffect(() => {
        const handleKeyDown = (e) => {
            switch (e.key) {
                case 'ArrowRight':
                case ' ':
                    e.preventDefault();
                    goToNextPage();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    goToPrevPage();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    goToPrevPage();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    goToNextPage();
                    break;
                case 'Escape':
                    if (isFullscreen) {
                        toggleFullscreen();
                    } else {
                        handleBackNavigation();
                    }
                    break;
                case 'f':
                case 'F11':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case 's':
                    e.preventDefault();
                    setShowSettings(!showSettings);
                    break;
                case 'o':
                    e.preventDefault();
                    setShowPageOverview(!showPageOverview);
                    break;
                case 'v':
                case 'V':
                    e.preventDefault();
                    setViewMode(prev => prev === 'single' ? 'scroll' : 'single');
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    handleZoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    handleZoomOut();
                    break;
                case '0':
                    e.preventDefault();
                    resetZoom();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        goToNextPage, 
        goToPrevPage, 
        handleBackNavigation, 
        isFullscreen, 
        toggleFullscreen,
        showSettings,
        showPageOverview,
        handleZoomIn,
        handleZoomOut,
        resetZoom
    ]);

    // Eventos de toque (swipe)
    const handleTouchStart = useCallback((e) => {
        if (viewMode === 'scroll') return; // Não processar toque no modo scroll
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }, [viewMode]);

    const handleTouchEnd = useCallback((e) => {
        if (viewMode === 'scroll') return; // Não processar toque no modo scroll
        
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;
        
        // Swipe horizontal
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
                // Swipe right
                goToPrevPage();
            } else {
                // Swipe left
                goToNextPage();
            }
        }
        // Tap no centro para toggle controles
        else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
            setShowControls(prev => !prev);
            resetControlsTimer();
        }
    }, [goToNextPage, goToPrevPage, resetControlsTimer, viewMode]);

    // Sistema de pré-carregamento inteligente
    useEffect(() => {
        if (pages.length === 0) return;
        
        // Pré-carregar páginas do capítulo atual e próximo
        preloadChapterPages(pages, currentPage, navigationInfo.nextPages);
        
    }, [currentPage, pages, navigationInfo.nextPages, preloadChapterPages]);
    
    // Pré-carregar próximo capítulo quando chegar próximo do fim
    useEffect(() => {
        if (navigationInfo.nextPages.length > 0 && currentPage >= pages.length - 5) {
            preloadChapter(navigationInfo.nextPages);
        }
    }, [currentPage, pages.length, navigationInfo.nextPages, preloadChapter]);

    if (!readerData || pages.length === 0) {
        if (import.meta.env?.DEV) {
            console.log('📖 [ReaderChapter] Renderizando loading:', {
                hasReaderData: !!readerData,
                pagesLength: pages.length,
                readerUrl,
                chapterId,
                readerDataChapters: readerData?.chapters ? Object.keys(readerData.chapters) : 'no chapters'
            });
        }
        return (
            <div className="chapter-reader loading">
                <Spinner size="lg" text="Carregando páginas..." />
            </div>
        );
    }

    return (
        <div 
            ref={containerRef}
            className={`chapter-reader ${viewMode === 'scroll' ? 'scroll-mode' : 'single-mode'} ${fitMode}`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Header com controles */}
            <div className={`chapter-reader-header ${showControls ? '' : 'hidden'}`}>
                <div className="chapter-reader-nav">
                    <button 
                        onClick={handleBackNavigation} 
                        className="chapter-reader-back"
                        title={currentHubData && currentHubUrl ? 'Voltar ao hub' : 'Voltar aos capítulos'}
                    >
                        <ChevronLeftIcon className="w-5 h-5" />
                        {currentHubData && currentHubUrl ? 'Hub' : 'Voltar'}
                    </button>
                    {(!currentHubData || !currentHubUrl) && (
                        <button 
                            onClick={handleHomeNavigation} 
                            className="chapter-reader-home"
                            title="Ir para a página inicial"
                        >
                            <HomeIcon className="w-4 h-4" />
                        </button>
                    )}
                    <div className="chapter-reader-info">
                        <h1 className="chapter-reader-title">{readerData.title}</h1>
                        <div className="chapter-reader-progress">
                            Cap. {navigationInfo.current?.id} 
                            {navigationInfo.current?.title && ` - ${navigationInfo.current.title}`}
                        </div>
                    </div>

                    <div className="chapter-reader-controls">
                        <span className="chapter-reader-progress">
                            {viewMode === 'single' ? (
                                `${currentPage + 1} / ${pages.length}`
                            ) : (
                                `Cap. ${navigationInfo.current?.id}`
                            )}
                        </span>
                        
                        <button 
                            className="btn btn-sm"
                            onClick={() => setViewMode(prev => prev === 'single' ? 'scroll' : 'single')}
                            title={viewMode === 'single' ? 'Modo scroll' : 'Modo página'}
                        >
                            {viewMode === 'single' ? <ViewColumnsIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                        <button 
                            className="btn btn-sm"
                            onClick={() => setShowPageOverview(!showPageOverview)}
                            title="Visão geral das páginas"
                        >
                            <GridIcon className="w-4 h-4" />
                        </button>
                        <button 
                            className="btn btn-sm"
                            onClick={() => setShowSettings(!showSettings)}
                            title="Configurações"
                        >
                            <CogIcon className="w-4 h-4" />
                        </button>
                        <button 
                            className="btn btn-sm"
                            onClick={toggleFullscreen}
                            title="Tela cheia"
                        >
                            <FullscreenIcon className="w-4 h-4" />
                        </button>
                        {viewMode === 'scroll' && (
                            <button 
                                className="btn btn-sm"
                                onClick={() => setShowControls(false)}
                                title="Ocultar controles"
                            >
                                <EyeIcon className="w-4 h-4" style={{ opacity: 0.5 }} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Areas (apenas no modo single) */}
            {viewMode === 'single' && (
                <>
                    <div className="chapter-page-nav chapter-page-nav--prev" onClick={goToPrevPage}>
                        {navigationInfo.prev && currentPage === 0 && (
                            <div className="chapter-nav-hint">
                                Cap. {navigationInfo.prev}
                            </div>
                        )}
                    </div>

                    <div className="chapter-page-nav chapter-page-nav--next" onClick={goToNextPage}>
                        {navigationInfo.next && currentPage === pages.length - 1 && (
                            <div className="chapter-nav-hint">
                                Cap. {navigationInfo.next}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Content Area */}
            <div className="chapter-reader-content">
                {viewMode === 'single' ? (
                    // Single Page Mode
                    <div className="chapter-pages-container" onClick={handleInteraction}>
                        <div className="chapter-page">
                            <div 
                                className="chapter-page-image"
                                style={{ 
                                    transform: `scale(${zoomLevel})`,
                                    transformOrigin: 'center center'
                                }}
                            >
                                <CachedImage
                                    src={pages[currentPage]}
                                    alt={`Página ${currentPage + 1}`}
                                    className={`chapter-page-image ${fitMode}`}
                                    loading="eager"
                                    onError={(e) => {
                                        console.error('Erro ao carregar página:', pages[currentPage]);
                                    }}
                                />
                            </div>
                            <div className="chapter-page-number">
                                {currentPage + 1}
                            </div>
                        </div>
                    </div>
                ) : (
                    // Scroll Mode
                    <div className="chapter-pages-container" onClick={handleInteraction}>
                        {pages.map((pageUrl, index) => (
                            <div key={index} className="chapter-page">
                                <CachedImage
                                    src={pageUrl}
                                    alt={`Página ${index + 1}`}
                                    className={`chapter-page-image ${fitMode}`}
                                    loading={index < 3 ? 'eager' : 'lazy'}
                                />
                                <div className="chapter-page-number">
                                    {index + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className={`reader-settings-panel ${showSettings ? 'open' : ''}`}>
                    <div className="reader-setting-group">
                        <button 
                            onClick={() => setShowSettings(false)}
                            className="btn btn-sm"
                            style={{ float: 'right' }}
                        >
                            ✕
                        </button>
                        <h3>Configurações</h3>
                    </div>
                    
                    <div className="reader-setting-group">
                        <label className="reader-setting-label">Ajuste da Imagem</label>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <button 
                                className={`btn btn-sm ${fitMode === 'fit-width' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setFitMode('fit-width')}
                            >
                                Largura
                            </button>
                            <button 
                                className={`btn btn-sm ${fitMode === 'fit-height' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setFitMode('fit-height')}
                            >
                                Altura
                            </button>
                            <button 
                                className={`btn btn-sm ${fitMode === 'original' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setFitMode('original')}
                            >
                                Original
                            </button>
                        </div>
                    </div>

                    <div className="reader-setting-group">
                        <label className="reader-setting-label">Zoom: {Math.round(zoomLevel * 100)}%</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <button onClick={handleZoomOut} className="btn btn-sm">
                                <ZoomOutIcon className="w-4 h-4" />
                            </button>
                            <input 
                                type="range"
                                min="0.5"
                                max="3"
                                step="0.25"
                                value={zoomLevel}
                                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                                className="reader-setting-slider"
                            />
                            <button onClick={handleZoomIn} className="btn btn-sm">
                                <ZoomInIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Overview */}
            {showPageOverview && (
                <div className="reader-settings-panel open">
                    <div className="reader-setting-group">
                        <button 
                            onClick={() => setShowPageOverview(false)}
                            className="btn btn-sm"
                            style={{ float: 'right' }}
                        >
                            ✕
                        </button>
                        <h3>Páginas do Capítulo</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 'var(--space-2)', maxHeight: '400px', overflowY: 'auto' }}>
                        {pages.map((pageUrl, index) => (
                            <div 
                                key={index}
                                className={`card ${index === currentPage ? 'border-primary' : ''}`}
                                onClick={() => goToPage(index)}
                                style={{ cursor: 'pointer', textAlign: 'center', padding: 'var(--space-2)' }}
                            >
                                <img 
                                    src={pageUrl} 
                                    alt={`Página ${index + 1}`}
                                    loading="lazy"
                                    style={{ width: '100%', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                                />
                                <small>{index + 1}</small>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Back to Top Button (apenas no modo scroll) */}
            {viewMode === 'scroll' && showBackToTop && (
                <button 
                    onClick={scrollToTop}
                    className="back-to-top-btn"
                    title="Voltar ao topo"
                >
                    ↑
                </button>
            )}

            {/* Toggle Controls Button (apenas no modo scroll quando controles estão ocultos) */}
            {viewMode === 'scroll' && !showControls && (
                <button 
                    onClick={() => setShowControls(true)}
                    className="toggle-controls-btn"
                    title="Mostrar controles"
                >
                    <EyeIcon className="w-5 h-5" />
                </button>
            )}

            {/* Footer Navigation */}
            <div className={`chapter-reader-footer ${showControls ? '' : 'hidden'}`}>
                <div className="chapter-navigation">
                    {navigationInfo.prev && (
                        <button 
                            onClick={() => goToChapter(navigationInfo.prev)}
                            className="chapter-nav-button"
                        >
                            <ChevronLeftIcon className="w-4 h-4" />
                            Cap. {navigationInfo.prev}
                        </button>
                    )}
                    
                    <div className="chapter-progress-bar">
                        <div 
                            className="chapter-progress-fill"
                            style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}
                        />
                    </div>
                    
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                        {navigationInfo.current?.index} de {navigationInfo.current?.total}
                    </span>
                    
                    {navigationInfo.next && (
                        <button 
                            onClick={() => goToChapter(navigationInfo.next)}
                            className="chapter-nav-button"
                        >
                            Cap. {navigationInfo.next}
                            <ChevronRightIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReaderChapter;