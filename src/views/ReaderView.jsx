// AIDEV-NOTE: Reader view for manga/series with chapter listing and navigation
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReader } from '../hooks/useReader';
import { useAppContext } from '../context/AppContext';
import { decodeUrl, encodeUrl } from '../utils/encoding';
import { BookOpenIcon, PlayIcon, ClockIcon, ChevronLeftIcon, EyeIcon, SortAscendingIcon, SortDescendingIcon } from '../components/common/Icones';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';
import Image from '../components/common/Image';
import BackToTopButton from '../components/common/BackToTopButton';
import { FixedSizeList as List } from 'react-window';

const INITIAL_CHAPTERS_DISPLAY_COUNT = 20; // AIDEV-NOTE: Initial chapter display limit for performance

const ReaderView = () => {
    const { encodedUrl } = useParams();
    const navigate = useNavigate();
    const [showAllChapters, setShowAllChapters] = useState(false);
    const [sortOrder, setSortOrder] = useState('desc'); // AIDEV-NOTE: 'asc' or 'desc' for chapter ordering
    
    const { clearSelectedItem, currentHubData, currentHubUrl } = useAppContext();
    
    const {
        readerData,
        isLoading,
        error,
        loadReader,
        selectChapter,
        markChapterAsRead,
        saveReadingProgress
    } = useReader();

    // AIDEV-NOTE: Clears previous selection when entering ReaderView
    useEffect(() => {
        clearSelectedItem();
    }, [clearSelectedItem]);

    // AIDEV-NOTE: Decodes URL and loads manga data
    useEffect(() => {
        if (encodedUrl) {
            try {
                const decodedUrl = decodeUrl(encodedUrl);
                console.log('📖 Carregando manga:', decodedUrl);
                loadReader(decodedUrl);
            } catch (error) {
                console.error('❌ Erro ao decodificar URL:', error);
            }
        }
    }, [encodedUrl, loadReader]);

    // AIDEV-NOTE: Chapter list with display limit and smart numerical/alphabetical sorting
    const displayedChapters = useMemo(() => {
        if (!readerData?.chapters) return [];
        
        const chapterKeys = Object.keys(readerData.chapters).sort((a, b) => {
            // AIDEV-NOTE: Sorts numerically when possible, falls back to alphabetical
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (!isNaN(numA) && !isNaN(numB)) {
                return sortOrder === 'asc' ? numA - numB : numB - numA;
            }
            // AIDEV-NOTE: Fallback to alphabetical sorting
            return sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
        });
        
        const chapters = chapterKeys.map(key => ({
            id: key,
            ...readerData.chapters[key],
            isRead: false, // AIDEV-TODO: implement reading progress system
        }));
        
        return showAllChapters ? chapters : chapters.slice(0, INITIAL_CHAPTERS_DISPLAY_COUNT);
    }, [readerData?.chapters, showAllChapters, sortOrder]);

    // AIDEV-NOTE: Handles chapter selection and navigation with URL encoding
    const handleReadChapter = useCallback((chapterId) => {
        // A encodedUrl da obra já está disponível via useParams()
        // O chapterId é codificado antes de ser passado para a nova rota
        navigate(`/read/${encodedUrl}/${encodeUrl(chapterId)}`);
    }, [navigate, encodedUrl, selectChapter]);

    const handleMarkAsRead = async (chapterId) => {
        await markChapterAsRead(chapterId);
    };

    // AIDEV-NOTE: Formats timestamp to Brazilian date format
    const formatDate = (timestamp) => {
        if (!timestamp) return 'Data desconhecida';
        const date = new Date(parseInt(timestamp) * 1000);
        return date.toLocaleDateString('pt-BR');
    };

    // AIDEV-NOTE: Gets page count from first group (common pattern)
    const getPageCount = (chapter) => {
        const groups = chapter.groups || {};
        const groupKeys = Object.keys(groups);
        if (groupKeys.length === 0) return 0;
        return groups[groupKeys[0]]?.length || 0;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
                <div className="text-center max-w-md w-full">
                    <div className="mb-6">
                        <Spinner size="lg" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">Carregando manga...</h2>
                    <p className="text-gray-400 text-sm sm:text-base">Aguarde enquanto buscamos as informações da obra</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-6">
                <div className="max-w-lg w-full text-center">
                    <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 sm:p-8">
                        <div className="mb-6">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Erro ao carregar</h2>
                            <ErrorMessage 
                                message={`Não foi possível carregar o manga: ${error.message}`}
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <Button
                                onClick={() => window.location.reload()}
                                variant="primary"
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3"
                            >
                                Tentar novamente
                            </Button>
                            <Button
                                onClick={() => navigate(-1)}
                                variant="secondary"
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3"
                            >
                                Voltar
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!readerData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-6">
                <div className="text-center max-w-md w-full">
                    <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 sm:p-8">
                        <div className="mb-6">
                            <BookOpenIcon className="w-16 h-16 sm:w-20 sm:h-20 text-gray-600 opacity-50 mx-auto mb-4" />
                            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">Manga não encontrado</h2>
                            <p className="text-gray-400 text-sm sm:text-base">Não foi possível encontrar os dados desta obra.</p>
                        </div>
                        <Button
                            onClick={() => navigate(-1)}
                            variant="secondary"
                            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3"
                        >
                            Voltar
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Header minimalista com navegação */}
            <div className="border-b border-gray-800 sticky top-0 z-20 bg-gray-950/95 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto px-4 py-3">
                    {/* AIDEV-NOTE: Navigation buttons - Hub and Series side by side */}
                    <div className="flex items-center gap-3">
                        {/* AIDEV-NOTE: Minimalist back to hub button - visible but clean design */}
                        <Button
                            onClick={() => navigate('/')}
                            variant="outline"
                            className="text-white hover:bg-gray-800 border-gray-600 hover:border-gray-500 px-3 py-2 flex items-center gap-2"
                            title="Voltar ao Hub"
                        >
                            <ChevronLeftIcon className="w-4 h-4" />
                            <span className="text-sm">Hub</span>
                        </Button>
                        
                        {/* AIDEV-NOTE: Series button - navigates to current hub (scan page) */}
                        {currentHubData && currentHubUrl && (
                            <Button
                                onClick={() => {
                                    const encodedHubUrl = encodeUrl(currentHubUrl);
                                    navigate(`/hub/${encodedHubUrl}`);
                                }}
                                variant="outline"
                                className="text-white hover:bg-gray-800 border-gray-600 hover:border-gray-500 px-3 py-2 flex items-center gap-2"
                                title="Ir para a página da scan"
                            >
                                <span className="text-sm"></span>
                                <span className="text-sm">Série</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Seção principal */}
                <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-6 mb-6">
                    <div className="flex gap-6">
                        {/* Capa da obra */}
                        <div className="flex-shrink-0">
                            <div className="w-32 h-48 relative">
                                <Image
                                    src={readerData.cover}
                                    alt={readerData.title}
                                    className="w-full h-full object-cover rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Informações da obra */}
                        <div className="flex-1 space-y-3">
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-2">
                                    {readerData.title}
                                </h1>
                                
                                {readerData.author && (
                                    <p className="text-gray-400 text-sm">
                                        por {readerData.author}
                                    </p>
                                )}
                            </div>

                            {/* Descrição */}
                            {readerData.description && (
                                <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                                    <div className="text-gray-300 text-sm leading-relaxed max-h-24 overflow-y-auto">
                                        {readerData.description.split('\n').map((paragraph, index) => (
                                            paragraph.trim() && (
                                                <p key={index} className="mb-2 last:mb-0">
                                                    {paragraph.trim()}
                                                </p>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-4">
                                <span className="text-gray-300 text-sm">
                                    {Object.keys(readerData.chapters || {}).length} capítulos
                                </span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                    readerData.status === 'Em Andamento' ? 'bg-green-900/50 text-green-300' :
                                    readerData.status === 'Completo' ? 'bg-blue-900/50 text-blue-300' :
                                    'bg-gray-700/50 text-gray-300'
                                }`}>
                                    {readerData.status}
                                </span>
                            </div>

                            {displayedChapters.length > 0 && (
                                <Button
                                    onClick={() => handleReadChapter(displayedChapters[0].id)}
                                    variant="primary"
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2"
                                >
                                    <PlayIcon className="w-4 h-4 mr-2" />
                                    {sortOrder === 'asc' ? 'Começar' : 'Último'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Lista de capítulos */}
                <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-white">Capítulos</h2>
                        
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                variant="ghost"
                                className="text-gray-400 hover:text-white px-3 py-1 text-sm"
                            >
                                {sortOrder === 'asc' ? 'Mais antigos' : 'Mais recentes'}
                            </Button>
                            
                            {displayedChapters.length < Object.keys(readerData.chapters || {}).length && (
                                <Button
                                    onClick={() => setShowAllChapters(true)}
                                    variant="ghost"
                                    className="text-blue-400 hover:text-blue-300 px-3 py-1 text-sm"
                                >
                                    Ver todos
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        {/* AIDEV-NOTE: Virtualiza lista de capítulos com react-window se houver muitos capítulos (>100) automaticamente */}
                        {displayedChapters.length > 100 ? (
                            <List
                                height={600}
                                itemCount={displayedChapters.length}
                                itemSize={72}
                                width={"100%"}
                                style={{overflowX: 'hidden'}}
                            >
                                {({ index, style }) => {
                                    const chapter = displayedChapters[index];
                                    return (
                                        <div
                                            key={chapter.id}
                                            style={style}
                                            className="flex items-center justify-between p-4 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg border border-gray-700/30 hover:border-gray-600/50 cursor-pointer transition-colors"
                                            onClick={() => handleReadChapter(chapter.id)}
                                        >
                                            <div className="flex-1">
                                                <h3 className="font-medium text-white mb-1">
                                                    {chapter.title || `Capítulo ${chapter.id}`}
                                                </h3>
                                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                                    <span>{getPageCount(chapter)} páginas</span>
                                                    <span>{formatDate(chapter.last_updated)}</span>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleReadChapter(chapter.id);
                                                }}
                                                variant="ghost"
                                                className="text-blue-400 hover:text-blue-300 p-2"
                                            >
                                                <PlayIcon className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    );
                                }}
                            </List>
                        ) : (
                            displayedChapters.map((chapter) => (
                                <div
                                    key={chapter.id}
                                    className="flex items-center justify-between p-4 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg border border-gray-700/30 hover:border-gray-600/50 cursor-pointer transition-colors"
                                    onClick={() => handleReadChapter(chapter.id)}
                                >
                                    <div className="flex-1">
                                        <h3 className="font-medium text-white mb-1">
                                            {chapter.title || `Capítulo ${chapter.id}`}
                                        </h3>
                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                            <span>{getPageCount(chapter)} páginas</span>
                                            <span>{formatDate(chapter.last_updated)}</span>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleReadChapter(chapter.id);
                                        }}
                                        variant="ghost"
                                        className="text-blue-400 hover:text-blue-300 p-2"
                                    >
                                        <PlayIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>

                    {displayedChapters.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-400">Nenhum capítulo disponível</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* AIDEV-NOTE: Back to top button for chapter listing */}
            <BackToTopButton threshold={300} />
        </div>
    );
};

export default ReaderView;
