// src/pages/ReaderChapter.jsx - Versão com Modo Scroll e Cache Otimizado
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReader } from '../hooks/useReader';
import useImageCache from '../hooks/useImageCache';
import { decodeUrl, encodeUrl } from '../utils/encoding';
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
    EyeIcon
} from '../components/common/Icones';

const ReaderChapter = () => {
    const { encodedUrl, encodedChapterId } = useParams();
    const navigate = useNavigate();
    const { readerData, loadReader } = useReader();
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

    // Controles automáticos
    const resetControlsTimer = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 4000);
    }, []);

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
            navigate(`/reader/${encodedUrl}/${encodedNext}`);
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
            navigate(`/reader/${encodedUrl}/${encodedPrev}`);
        }
        resetControlsTimer();
    }, [currentPage, navigationInfo.prev, encodedUrl, navigate, resetControlsTimer, viewMode]);

    const goToPage = useCallback((pageIndex) => {
        setCurrentPage(Math.max(0, Math.min(pageIndex, pages.length - 1)));
        setShowPageOverview(false);
        resetControlsTimer();
    }, [pages.length, resetControlsTimer]);

    // Navegação por capítulos
    const goToChapter = useCallback((chapterIdToGo) => {
        const encodedChapter = encodeUrl(chapterIdToGo);
        navigate(`/reader/${encodedUrl}/${encodedChapter}`);
    }, [encodedUrl, navigate]);

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
                        navigate(`/manga/${encodedUrl}`);
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
        navigate, 
        encodedUrl, 
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
        return (
            <div className="chapter-viewer loading">
                <Spinner size="lg" text="Carregando páginas..." />
            </div>
        );
    }

    return (
        <div 
            ref={containerRef}
            className={`chapter-viewer ${viewMode} ${fitMode}`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Header com controles */}
            <div className={`viewer-header ${showControls ? 'visible' : ''}`}>
                <div className="header-left">
                    <button 
                        onClick={() => navigate(`/manga/${encodedUrl}`)} 
                        className="control-btn back-btn"
                        title="Voltar aos capítulos"
                    >
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    <div className="chapter-info">
                        <span className="work-title">{readerData.title}</span>
                        <span className="chapter-title">
                            Cap. {navigationInfo.current?.id} 
                            {navigationInfo.current?.title && ` - ${navigationInfo.current.title}`}
                        </span>
                    </div>
                </div>

                <div className="header-center">
                <div className="page-indicator">
                {viewMode === 'single' ? (
                <span>{currentPage + 1} / {pages.length}</span>
                ) : (
                <span>Cap. {navigationInfo.current?.id}</span>
                )}
                {viewMode === 'single' && (
                <div className="progress-bar-mini">
                <div 
                className="progress-fill-mini"
                style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}
                />
                </div>
                )}
                    {isPreloading && (
                            <div className="cache-indicator" title="Pré-carregando próximas páginas">
                                    <div className="loading-dot"></div>
                                </div>
                            )}
                        </div>
                    </div>

                <div className="header-right">
                    <button 
                        className="control-btn"
                        onClick={() => setViewMode(prev => prev === 'single' ? 'scroll' : 'single')}
                        title={viewMode === 'single' ? 'Modo scroll' : 'Modo página'}
                    >
                        {viewMode === 'single' ? <ViewColumnsIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                    <button 
                        className="control-btn"
                        onClick={() => setShowPageOverview(!showPageOverview)}
                        title="Visão geral das páginas"
                    >
                        <GridIcon className="w-5 h-5" />
                    </button>
                    <button 
                        className="control-btn"
                        onClick={() => setShowSettings(!showSettings)}
                        title="Configurações"
                    >
                        <CogIcon className="w-5 h-5" />
                    </button>
                    <button 
                        className="control-btn"
                        onClick={toggleFullscreen}
                        title="Tela cheia"
                    >
                        <FullscreenIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Controles laterais (apenas no modo single) */}
            {viewMode === 'single' && (
                <>
                    <div className={`side-controls left ${showControls ? 'visible' : ''}`}>
                        <button 
                            onClick={goToPrevPage}
                            disabled={currentPage === 0 && !navigationInfo.prev}
                            className="nav-btn prev-btn"
                            title="Página anterior"
                        >
                            <ChevronLeftIcon className="w-8 h-8" />
                        </button>
                        {navigationInfo.prev && currentPage === 0 && (
                            <div className="chapter-nav-hint">
                                Cap. {navigationInfo.prev}
                            </div>
                        )}
                    </div>

                    <div className={`side-controls right ${showControls ? 'visible' : ''}`}>
                        <button 
                            onClick={goToNextPage}
                            disabled={currentPage === pages.length - 1 && !navigationInfo.next}
                            className="nav-btn next-btn"
                            title="Próxima página"
                        >
                            <ChevronRightIcon className="w-8 h-8" />
                        </button>
                        {navigationInfo.next && currentPage === pages.length - 1 && (
                            <div className="chapter-nav-hint">
                                Cap. {navigationInfo.next}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Container das páginas */}
            {viewMode === 'single' ? (
                // Modo página única
                <div className="page-container" onClick={handleInteraction}>
                    <div 
                        className="page-wrapper"
                        style={{ 
                            transform: `scale(${zoomLevel})`,
                            transformOrigin: 'center center'
                        }}
                    >
                        <CachedImage
                            src={pages[currentPage]}
                            alt={`Página ${currentPage + 1}`}
                            className={`page-image ${fitMode}`}
                            loading="eager"
                            onError={(e) => {
                                console.error('Erro ao carregar página:', pages[currentPage]);
                            }}
                        />
                    </div>
                </div>
            ) : (
                // Modo scroll contínuo
                <div className="scroll-container">
                    {pages.map((pageUrl, index) => (
                        <div key={index} className="scroll-page">
                            <CachedImage
                                src={pageUrl}
                                alt={`Página ${index + 1}`}
                                className={`page-image ${fitMode}`}
                                loading={index < 3 ? 'eager' : 'lazy'}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Painel de configurações */}
            {showSettings && (
                <div className="settings-panel">
                    <div className="settings-header">
                        <h3>Configurações do Leitor</h3>
                        <button 
                            onClick={() => setShowSettings(false)}
                            className="close-btn"
                        >
                            ✕
                        </button>
                    </div>
                    
                    <div className="settings-content">
                        <div className="setting-group">
                            <label>Ajuste da Imagem</label>
                            <div className="setting-buttons">
                                <button 
                                    className={`setting-btn ${fitMode === 'fit-width' ? 'active' : ''}`}
                                    onClick={() => setFitMode('fit-width')}
                                >
                                    Largura
                                </button>
                                <button 
                                    className={`setting-btn ${fitMode === 'fit-height' ? 'active' : ''}`}
                                    onClick={() => setFitMode('fit-height')}
                                >
                                    Altura
                                </button>
                                <button 
                                    className={`setting-btn ${fitMode === 'original' ? 'active' : ''}`}
                                    onClick={() => setFitMode('original')}
                                >
                                    Original
                                </button>
                            </div>
                        </div>

                        <div className="setting-group">
                            <label>Zoom: {Math.round(zoomLevel * 100)}%</label>
                            <div className="zoom-controls">
                                <button onClick={handleZoomOut} className="zoom-btn">
                                    <ZoomOutIcon className="w-4 h-4" />
                                </button>
                                <input 
                                    type="range"
                                    min="0.5"
                                    max="3"
                                    step="0.25"
                                    value={zoomLevel}
                                    onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                                    className="zoom-slider"
                                />
                                <button onClick={handleZoomIn} className="zoom-btn">
                                    <ZoomInIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Visão geral das páginas */}
            {showPageOverview && (
                <div className="page-overview">
                    <div className="overview-header">
                        <h3>Páginas do Capítulo</h3>
                        <button 
                            onClick={() => setShowPageOverview(false)}
                            className="close-btn"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="overview-grid">
                        {pages.map((pageUrl, index) => (
                            <div 
                                key={index}
                                className={`overview-item ${index === currentPage ? 'current' : ''}`}
                                onClick={() => goToPage(index)}
                            >
                                <img 
                                    src={pageUrl} 
                                    alt={`Página ${index + 1}`}
                                    loading="lazy"
                                />
                                <span className="page-number">{index + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer com navegação de capítulos */}
            <div className={`viewer-footer ${showControls ? 'visible' : ''}`}>
                <div className="chapter-navigation">
                    {navigationInfo.prev && (
                        <button 
                            onClick={() => goToChapter(navigationInfo.prev)}
                            className="chapter-nav-btn prev"
                        >
                            <ChevronLeftIcon className="w-4 h-4" />
                            Cap. {navigationInfo.prev}
                        </button>
                    )}
                    
                    <span className="chapter-position">
                        {navigationInfo.current?.index} de {navigationInfo.current?.total}
                    </span>
                    
                    {navigationInfo.next && (
                        <button 
                            onClick={() => goToChapter(navigationInfo.next)}
                            className="chapter-nav-btn next"
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