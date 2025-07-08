// src/pages/PageView.jsx - Versão Melhorada
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useReader } from '../hooks/useReader';
import { useRemoteStorageContext } from '../context/RemoteStorageContext';
import { useHubContext } from '../context/HubContext';
import { decodeUrl, encodeUrl } from '../utils/encoding';
import { NavigationService } from '../utils/navigationService';
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

    // AIDEV-NOTE: Compartilhar com URL limpa (sem basename)
    const handleShare = useCallback(async () => {
        const shareData = NavigationService.generateShareData({
            title: readerData.title,
            text: `Confira "${readerData.title}" - ${chapters.length} capítulos disponíveis`
        });

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Compartilhamento cancelado');
            }
        } else {
            // Fallback: copiar para clipboard com URL limpa
            navigator.clipboard.writeText(shareData.url);
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
            <div className="reader-view-container loading">
                <Spinner size="lg" text="Carregando obra..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="reader-view-container error">
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
        <div className="reader-view-container">
            {/* Navigation Header */}
            <div className="reader-header-fixed">
                <div className="reader-header-content">
                    <div className="reader-nav-buttons">
                        <button onClick={goBackToHub} className="btn btn-secondary">
                            <ChevronLeftIcon className="w-4 h-4" />
                            Voltar ao Hub
                        </button>
                        <span className="text-secondary">→ {title}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="reader-main-section">
                <div className="reader-work-info">
                    <div className="reader-cover-container">
                        <Image
                            src={cover}
                            alt={`Capa de ${title}`}
                            className="reader-cover-image"
                            errorSrc="https://placehold.co/300x450/1e293b/94a3b8?text=Capa"
                        />
                    </div>

                    <div className="reader-work-details">
                        <h1 className="reader-work-title">{title}</h1>
                        <p className="reader-work-author">por {author || 'Autor desconhecido'}</p>
                        
                        {/* Description */}
                        {description && (
                            <div className="reader-work-description">{description}</div>
                        )}
                        
                        {/* Meta Information */}
                        <div className="reader-work-meta">
                            <span className={`reader-status-badge reader-status-badge--${status?.toLowerCase().replace(' ', '-') || 'ongoing'}`}>
                                {status || 'Em Andamento'}
                            </span>
                            <span className="reader-work-stats">
                                <BookOpenIcon className="w-4 h-4" />
                                {stats.totalChapters} capítulos
                            </span>
                            {publishedDate && (
                                <span className="reader-work-stats">
                                    <CalendarIcon className="w-4 h-4" />
                                    {new Date(publishedDate).toLocaleDateString('pt-BR')}
                                </span>
                            )}
                            <button 
                                className="btn btn-icon"
                                onClick={handleBookmark}
                                title={isBookmarked ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                            >
                                <HeartIcon className={`w-5 h-5 ${isBookmarked ? 'text-red-500' : ''}`} />
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="reader-work-meta">
                            <Button
                                onClick={handleContinueReading}
                                className="btn btn-primary"
                                disabled={chapters.length === 0}
                            >
                                <PlayIcon className="w-5 h-5" />
                                {stats.readChapters > 0 ? 'Continuar Leitura' : 'Começar a Ler'}
                            </Button>
                            
                            {nextChapter && (
                                <Button
                                    onClick={() => handleChapterSelect(nextChapter.id)}
                                    className="btn btn-secondary"
                                >
                                    Próximo: Cap. {nextChapter.id}
                                </Button>
                            )}

                            <button 
                                className="btn btn-icon" 
                                onClick={handleShare}
                                title="Compartilhar"
                            >
                                <ShareIcon className="w-5 h-5" />
                            </button>
                            
                            {showShareMenu && (
                                <div className="tooltip">Link copiado!</div>
                            )}
                        </div>
                        
                        {/* Progress */}
                        {stats.readChapters > 0 && (
                            <div className="reader-work-meta">
                                <small>Progresso: {stats.readChapters}/{stats.totalChapters} ({stats.progressPercent}%)</small>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chapter List */}
                <div className="reader-chapters-section">
                    <div className="reader-chapters-header">
                        <h2 className="reader-chapters-title">
                            Capítulos ({stats.totalChapters})
                        </h2>
                        <div className="reader-chapters-controls">
                            <button 
                                className={`btn btn-sm ${sortOrder === 'asc' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setSortOrder('asc')}
                                title="Ordem crescente"
                            >
                                <SortAscendingIcon className="w-4 h-4" />
                            </button>
                            <button 
                                className={`btn btn-sm ${sortOrder === 'desc' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setSortOrder('desc')}
                                title="Ordem decrescente"
                            >
                                <SortDescendingIcon className="w-4 h-4" />
                            </button>
                            <button 
                                className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setViewMode('grid')}
                                title="Visualização em grade"
                            >
                                <GridIcon className="w-4 h-4" />
                            </button>
                            <button 
                                className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setViewMode('list')}
                                title="Visualização em lista"
                            >
                                <ListIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="reader-chapters-grid">
                        {chapters.map((chapter) => (
                            <div
                                key={chapter.id}
                                className={`reader-chapter-card ${chapter.isRead ? 'read' : 'unread'}`}
                                onClick={() => handleChapterSelect(chapter.id)}
                            >
                                <div className="reader-chapter-number">
                                    {chapter.index}
                                </div>
                                <div className="reader-chapter-info">
                                    <h3 className="reader-chapter-title">
                                        Cap. {chapter.id}
                                        {chapter.title && ` - ${chapter.title}`}
                                    </h3>
                                    <div className="reader-chapter-meta">
                                        <span>{chapter.totalPages} páginas</span>
                                        {chapter.isRead && <span>✓ Lido</span>}
                                        {chapter.lastPage > 0 && !chapter.isRead && (
                                            <span>Página {chapter.lastPage}/{chapter.totalPages}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="reader-chapter-action">
                                    <PlayIcon className="w-4 h-4" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {chapters.length === 0 && (
                        <div className="min-empty-state">
                            <BookOpenIcon className="min-empty-icon" />
                            <div className="min-empty-title">Nenhum capítulo disponível</div>
                            <div className="min-empty-description">Esta obra ainda não possui capítulos para leitura.</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PageView;