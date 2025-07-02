import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReader } from '../hooks/useReader';
import { useAppContext } from '../context/AppContext';
import { decodeUrl, encodeUrl } from '../utils/encoding';
import { BookOpenIcon, PlayIcon, ClockIcon, ChevronLeftIcon, EyeIcon } from '../components/common/Icones';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';
import Image from '../components/common/Image';

const ReaderView = () => {
    const { encodedUrl } = useParams();
    const navigate = useNavigate();
    const [showAllChapters, setShowAllChapters] = useState(false);
    
    const { clearSelectedItem } = useAppContext();
    
    const {
        readerData,
        isLoading,
        error,
        loadReader,
        selectChapter,
        markChapterAsRead,
        saveReadingProgress
    } = useReader();

    // Limpa seleção anterior quando entra no ReaderView
    useEffect(() => {
        clearSelectedItem();
    }, [clearSelectedItem]);

    // Decodifica URL e carrega dados do manga
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

    // Lista de capítulos com limite
    const displayedChapters = useMemo(() => {
        if (!readerData?.chapters) return [];
        
        const chapterKeys = Object.keys(readerData.chapters).sort();
        const chapters = chapterKeys.map(key => ({
            id: key,
            ...readerData.chapters[key],
            isRead: false, // TODO: implementar sistema de progresso
        })).reverse(); // Mais recentes primeiro
        
        return showAllChapters ? chapters : chapters.slice(0, 20);
    }, [readerData?.chapters, showAllChapters]);

    const handleReadChapter = (chapterId) => {
        console.log('🎯 Iniciando leitura do capítulo:', chapterId);
        selectChapter(chapterId);
        // Navega para visualização do capítulo específico
        navigate(`/read/${encodedUrl}/${encodeUrl(chapterId)}`);
    };

    const handleMarkAsRead = async (chapterId) => {
        await markChapterAsRead(chapterId);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Data desconhecida';
        const date = new Date(parseInt(timestamp) * 1000);
        return date.toLocaleDateString('pt-BR');
    };

    const getPageCount = (chapter) => {
        const groups = chapter.groups || {};
        const groupKeys = Object.keys(groups);
        if (groupKeys.length === 0) return 0;
        return groups[groupKeys[0]]?.length || 0;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Spinner size="lg" />
                    <p className="mt-4 text-gray-400">Carregando manga...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center">
                    <ErrorMessage 
                        message={`Erro ao carregar manga: ${error.message}`}
                    />
                    <div className="mt-6 space-y-3">
                        <Button
                            onClick={() => window.location.reload()}
                            variant="primary"
                            className="w-full"
                        >
                            Tentar novamente
                        </Button>
                        <Button
                            onClick={() => navigate(-1)}
                            variant="secondary"
                            className="w-full"
                        >
                            Voltar
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!readerData) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center text-gray-400">
                    <p>Nenhum dado encontrado.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            {/* Header */}
            <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <Button
                        onClick={() => navigate(-1)}
                        variant="ghost"
                        className="text-gray-400 hover:text-white"
                    >
                        <ChevronLeftIcon className="w-5 h-5 mr-2" />
                        Voltar
                    </Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Hero Section */}
                <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800 p-8 mb-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Capa da obra */}
                        <div className="flex-shrink-0">
                            <div className="w-56 h-80 mx-auto lg:mx-0">
                                <Image
                                    src={readerData.cover}
                                    alt={readerData.title}
                                    className="w-full h-full object-cover rounded-xl shadow-2xl border border-gray-700"
                                />
                            </div>
                        </div>

                        {/* Informações da obra */}
                        <div className="flex-1 space-y-6">
                            <div>
                                <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-white">
                                    {readerData.title}
                                </h1>
                                
                                <div className="flex flex-wrap items-center gap-4 text-gray-300 mb-4">
                                    {readerData.author && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500">Autor:</span>
                                            <span className="font-medium">{readerData.author}</span>
                                        </div>
                                    )}
                                    {readerData.artist && readerData.artist !== readerData.author && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500">Arte:</span>
                                            <span className="font-medium">{readerData.artist}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        readerData.status === 'Em Andamento' ? 'bg-green-900/50 text-green-300 border border-green-700' :
                                        readerData.status === 'Completo' ? 'bg-blue-900/50 text-blue-300 border border-blue-700' :
                                        'bg-gray-700/50 text-gray-300 border border-gray-600'
                                    }`}>
                                        {readerData.status}
                                    </span>
                                </div>
                            </div>

                            {/* Estatísticas */}
                            <div className="flex flex-wrap gap-8 text-sm">
                                <div className="flex items-center gap-3 bg-gray-800/50 px-4 py-2 rounded-lg">
                                    <BookOpenIcon className="w-5 h-5 text-blue-400" />
                                    <span className="text-gray-300">{displayedChapters.length} capítulos</span>
                                </div>
                            </div>

                            {/* Botões de ação */}
                            <div className="flex gap-4">
                                {displayedChapters.length > 0 && (
                                    <>
                                        <Button
                                            onClick={() => handleReadChapter(displayedChapters[displayedChapters.length - 1].id)}
                                            variant="primary"
                                            size="lg"
                                            className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                                        >
                                            <PlayIcon className="w-5 h-5 mr-2" />
                                            Começar a ler
                                        </Button>
                                        
                                        <Button
                                            onClick={() => handleReadChapter(displayedChapters[0].id)}
                                            variant="secondary"
                                            size="lg"
                                            className="bg-gray-700 hover:bg-gray-600 text-white"
                                        >
                                            <EyeIcon className="w-5 h-5 mr-2" />
                                            Último capítulo
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lista de capítulos */}
                <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-800 p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">Capítulos</h2>
                        {displayedChapters.length < Object.keys(readerData.chapters || {}).length && (
                            <Button
                                onClick={() => setShowAllChapters(true)}
                                variant="ghost"
                                className="text-blue-400 hover:text-blue-300"
                            >
                                Ver todos os capítulos
                            </Button>
                        )}
                    </div>

                    <div className="space-y-2">
                        {displayedChapters.map((chapter) => (
                            <div
                                key={chapter.id}
                                className="flex items-center justify-between p-4 bg-gray-800/30 hover:bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-200 cursor-pointer group"
                                onClick={() => handleReadChapter(chapter.id)}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                                            {chapter.title || `Capítulo ${chapter.id}`}
                                        </h3>
                                        {chapter.volume && (
                                            <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded">
                                                Vol. {chapter.volume}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <BookOpenIcon className="w-4 h-4" />
                                            <span>{getPageCount(chapter)} páginas</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <ClockIcon className="w-4 h-4" />
                                            <span>{formatDate(chapter.last_updated)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleReadChapter(chapter.id);
                                        }}
                                        variant="ghost"
                                        size="sm"
                                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                    >
                                        <PlayIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {displayedChapters.length === 0 && (
                        <div className="text-center py-12">
                            <BookOpenIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400 text-lg">Nenhum capítulo disponível</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReaderView;
