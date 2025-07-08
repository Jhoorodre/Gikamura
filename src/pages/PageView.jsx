// src/pages/PageView.jsx - Versão Melhorada
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useReader } from '../hooks/useReader';
import { useRemoteStorageContext } from '../context/RemoteStorageContext';
import { useHubContext } from '../context/HubContext';
import { decodeUrl, encodeUrl } from '../utils/encoding';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';
import Image from '../components/common/Image';
import { 
    BookOpenIcon, 
    PlayIcon, 
    HeartIcon, 
    ShareIcon, 
    CalendarIcon,
    TagIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    GridIcon,
    ListIcon,
    StarIcon,
    SortAscendingIcon,
    SortDescendingIcon
} from '../components/common/Icones';

const PageView = () => {
    const { encodedUrl } = useParams();
    const navigate = useNavigate();
    const { readerData, isLoading, error, loadReader } = useReader();
    const { isConnected } = useRemoteStorageContext();
    const { currentHubData, currentHubUrl } = useHubContext();
    
    const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [readingProgress, setReadingProgress] = useState({});
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' ou 'desc'

    // Decodifica a URL da obra
    const readerUrl = useMemo(() => {
        try {
            return decodeUrl(encodedUrl);
        } catch (e) {
            console.error("URL codificada inválida:", e);
            return null;
        }
    }, [encodedUrl]);

    // Carrega os dados da obra
    useEffect(() => {
        if (readerUrl) {
            loadReader(readerUrl);
        }
    }, [readerUrl, loadReader]);

    // Carrega progresso de leitura do localStorage
    useEffect(() => {
        if (readerData?.title) {
            const saved = localStorage.getItem(`reading-progress-${readerData.title}`);
            if (saved) {
                setReadingProgress(JSON.parse(saved));
            }
        }
    }, [readerData?.title]);

    // Organiza e ordena capítulos
    const chapters = useMemo(() => {
        if (!readerData?.chapters) return [];
        
        return Object.entries(readerData.chapters)
            .sort(([keyA], [keyB]) => {
                const numA = parseFloat(keyA);
                const numB = parseFloat(keyB);
                if (!isNaN(numA) && !isNaN(numB)) {
                    return sortOrder === 'asc' ? numA - numB : numB - numA;
                }
                return sortOrder === 'asc' ? keyA.localeCompare(keyB) : keyB.localeCompare(keyA);
            })
            .map(([id, data], index) => ({ 
                id, 
                ...data, 
                index: index + 1,
                isRead: readingProgress[id]?.completed || false,
                lastPage: readingProgress[id]?.lastPage || 0,
                totalPages: data.groups ? Object.values(data.groups)[0]?.length || 0 : 0
            }));
    }, [readerData?.chapters, readingProgress, sortOrder]);

    // Estatísticas da obra
    const stats = useMemo(() => {
        const readChapters = chapters.filter(ch => ch.isRead).length;
        const totalChapters = chapters.length;
        const progressPercent = totalChapters > 0 ? Math.round((readChapters / totalChapters) * 100) : 0;
        
        return {
            totalChapters,
            readChapters,
            unreadChapters: totalChapters - readChapters,
            progressPercent
        };
    }, [chapters]);

    // Navegação para capítulo
    const handleChapterSelect = useCallback((chapterId) => {
        const encodedChapterId = encodeUrl(chapterId);
        navigate(`/reader/${encodedUrl}/${encodedChapterId}`);
    }, [encodedUrl, navigate]);

    // Continuar leitura (último capítulo lido ou primeiro não lido)
    const handleContinueReading = useCallback(() => {
        const lastReadChapter = chapters.find(ch => ch.isRead && ch.lastPage > 0);
        const firstUnreadChapter = chapters.find(ch => !ch.isRead);
        const targetChapter = lastReadChapter || firstUnreadChapter || chapters[0];
        
        if (targetChapter) {
            handleChapterSelect(targetChapter.id);
        }
    }, [chapters, handleChapterSelect]);

    // Próximo capítulo não lido
    const getNextChapter = useCallback(() => {
        return chapters.find(ch => !ch.isRead);
    }, [chapters]);

    // Toggle bookmark
    const handleBookmark = useCallback(() => {
        setIsBookmarked(!isBookmarked);
        // Aqui integraria com RemoteStorage se conectado
        if (isConnected) {
            // Salvar bookmark no RemoteStorage
        }
    }, [isBookmarked, isConnected]);

    // Compartilhar
    const handleShare = useCallback(async () => {
        const shareData = {
            title: readerData.title,
            text: `Confira "${readerData.title}" - ${chapters.length} capítulos disponíveis`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Compartilhamento cancelado');
            }
        } else {
            // Fallback: copiar para clipboard
            navigator.clipboard.writeText(window.location.href);
            setShowShareMenu(true);
            setTimeout(() => setShowShareMenu(false), 2000);
        }
    }, [readerData?.title, chapters.length]);

    // Volta ao hub carregado ou página anterior
    const goBackToHub = useCallback(() => {
        if (import.meta.env?.DEV) {
            console.log('🔙 [PageView] goBackToHub - currentHubUrl:', currentHubUrl);
            console.log('🔙 [PageView] goBackToHub - currentHubData:', currentHubData);
        }
        
        if (currentHubUrl) {
            // Retorna ao hub atual que está carregado
            const encodedHubUrl = encodeUrl(currentHubUrl);
            if (import.meta.env?.DEV) {
                console.log('🔙 [PageView] Navegando para hub:', `/hub/${encodedHubUrl}`);
            }
            navigate(`/hub/${encodedHubUrl}`);
        } else {
            // Fallback para página anterior se não houver hub carregado
            if (import.meta.env?.DEV) {
                console.log('🔙 [PageView] Nenhum hub carregado, voltando página anterior');
            }
            navigate(-1);
        }
    }, [currentHubUrl, currentHubData, navigate]);

    // Renderização condicional
    if (isLoading || !readerData) {
        return (
            <div className="modern-reader-container loading">
                <Spinner size="lg" text="Carregando obra..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="modern-reader-container error">
                <ErrorMessage
                    title="Erro ao Carregar a Obra"
                    message={error.message}
                    onRetry={() => loadReader(readerUrl)}
                />
            </div>
        );
    }

    const { title, author, cover, description, status, genres, publishedDate } = readerData;
    const nextChapter = getNextChapter();

    return (
        <div className="modern-reader-container">
            {/* Breadcrumb */}
            <nav className="breadcrumb">
                <button onClick={goBackToHub} className="breadcrumb-btn">
                    <ChevronLeftIcon className="w-4 h-4" />
                    Hub
                </button>
                <ChevronRightIcon className="breadcrumb-separator" />
                <span className="breadcrumb-current">{title}</span>
            </nav>

            {/* Cabeçalho da obra */}
            <div className="manga-header">
                <div className="manga-cover">
                    <Image
                        src={cover}
                        alt={`Capa de ${title}`}
                        className="manga-cover-image"
                        errorSrc="https://placehold.co/300x450/1e293b/94a3b8?text=Capa"
                    />
                    <div className="cover-overlay">
                        <button 
                            className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
                            onClick={handleBookmark}
                            title={isBookmarked ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                        >
                            <HeartIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="manga-details">
                    <h1 className="manga-title">{title}</h1>
                    <p className="manga-author">por {author || 'Autor desconhecido'}</p>
                    
                    {/* Metadados */}
                    <div className="manga-meta">
                        <span className={`manga-status status-${status?.toLowerCase().replace(' ', '-')}`}>
                            {status || 'Status indefinido'}
                        </span>
                        <span className="manga-stats">
                            <BookOpenIcon className="w-4 h-4" />
                            {stats.totalChapters} capítulos
                        </span>
                        {publishedDate && (
                            <span className="manga-date">
                                <CalendarIcon className="w-4 h-4" />
                                {new Date(publishedDate).toLocaleDateString('pt-BR')}
                            </span>
                        )}
                        <div className="manga-rating">
                            {[...Array(5)].map((_, i) => (
                                <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
                            ))}
                            <span className="rating-text">4.5/5</span>
                        </div>
                    </div>

                    {/* Gêneros */}
                    {genres && genres.length > 0 && (
                        <div className="manga-genres">
                            <TagIcon className="w-4 h-4" />
                            <div className="genre-tags">
                                {genres.map((genre, index) => (
                                    <span key={index} className="genre-tag">{genre}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Progresso de leitura */}
                    {stats.readChapters > 0 && (
                        <div className="reading-progress">
                            <div className="progress-info">
                                <span>Progresso: {stats.readChapters}/{stats.totalChapters}</span>
                                <span>{stats.progressPercent}%</span>
                            </div>
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ width: `${stats.progressPercent}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Descrição */}
                    {description && (
                        <p className="manga-description">{description}</p>
                    )}

                    {/* Botões de ação */}
                    <div className="action-buttons">
                        <Button
                            onClick={handleContinueReading}
                            className="btn-primary btn-continue"
                            disabled={chapters.length === 0}
                        >
                            <PlayIcon className="w-5 h-5" />
                            {stats.readChapters > 0 ? 'Continuar Leitura' : 'Começar a Ler'}
                        </Button>
                        
                        {nextChapter && (
                            <Button
                                onClick={() => handleChapterSelect(nextChapter.id)}
                                className="btn-secondary"
                            >
                                Próximo: Cap. {nextChapter.id}
                            </Button>
                        )}

                        <button 
                            className="btn-icon" 
                            onClick={handleShare}
                            title="Compartilhar"
                        >
                            <ShareIcon className="w-5 h-5" />
                        </button>
                        
                        {showShareMenu && (
                            <div className="share-tooltip">Link copiado!</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lista de capítulos */}
            <div className="chapter-list-container">
                <div className="chapter-list-header">
                    <h2 className="chapter-list-title">
                        Capítulos ({stats.totalChapters})
                    </h2>
                    <div className="chapter-controls">
                        <div className="sort-controls">
                            <button 
                                className={`sort-btn ${sortOrder === 'asc' ? 'active' : ''}`}
                                onClick={() => setSortOrder('asc')}
                                title="Ordem crescente"
                            >
                                <SortAscendingIcon className="w-4 h-4" />
                            </button>
                            <button 
                                className={`sort-btn ${sortOrder === 'desc' ? 'active' : ''}`}
                                onClick={() => setSortOrder('desc')}
                                title="Ordem decrescente"
                            >
                                <SortDescendingIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="view-controls">
                            <button 
                                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                title="Visualização em grade"
                            >
                                <GridIcon className="w-5 h-5" />
                            </button>
                            <button 
                                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                                title="Visualização em lista"
                            >
                                <ListIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className={`chapter-list ${viewMode}`}>
                    {chapters.map((chapter) => (
                        <div
                            key={chapter.id}
                            className={`chapter-item ${chapter.isRead ? 'read' : 'unread'}`}
                            onClick={() => handleChapterSelect(chapter.id)}
                        >
                            <div className="chapter-info">
                                <div className="chapter-header">
                                    <span className="chapter-number">#{chapter.index}</span>
                                    <span className="chapter-id">Cap. {chapter.id}</span>
                                    {chapter.isRead && (
                                        <span className="read-indicator">✓</span>
                                    )}
                                </div>
                                <span className="chapter-title">
                                    {chapter.title || `Capítulo ${chapter.id}`}
                                </span>
                                {chapter.lastPage > 0 && (
                                    <div className="chapter-progress">
                                        <div className="progress-mini">
                                            <div 
                                                className="progress-mini-fill"
                                                style={{ 
                                                    width: `${(chapter.lastPage / chapter.totalPages) * 100}%` 
                                                }}
                                            />
                                        </div>
                                        <span className="progress-text">
                                            {chapter.lastPage}/{chapter.totalPages}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="chapter-actions">
                                <PlayIcon className="chapter-play-icon" />
                                <span className="page-count">{chapter.totalPages}p</span>
                            </div>
                        </div>
                    ))}
                </div>

                {chapters.length === 0 && (
                    <div className="empty-chapters">
                        <BookOpenIcon className="w-12 h-12 text-gray-400" />
                        <p>Nenhum capítulo disponível ainda</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PageView;