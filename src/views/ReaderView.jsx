import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReader } from '../hooks/useReader';
import { useAppContext } from '../context/AppContext';
import { decodeUrl, encodeUrl } from '../utils/encoding';
import { BookOpenIcon, PlayIcon, ClockIcon, CheckIcon, ChevronLeftIcon } from '../components/common/Icones';
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
                <Spinner size="lg" text="Carregando manga..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
                <div className="max-w-md w-full">
                    <ErrorMessage 
                        message={`Erro ao carregar manga: ${error.message}`}
                    />
                    <div className="mt-4 text-center">
                        <Button
                            onClick={() => navigate(-1)}
                            variant="outline"
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
                    <BookOpenIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Nenhum manga carregado</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header da obra */}
            <div className="relative">
                {/* Background com capa */}
                {readerData.cover && (
                    <div className="absolute inset-0 h-96">
                        <Image
                            src={readerData.cover}
                            alt={readerData.title}
                            className="w-full h-full object-cover opacity-20"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
                    </div>
                )}

                <div className="relative z-10 container mx-auto px-6 pt-8 pb-12">
                    {/* Botão voltar */}
                    <Button
                        onClick={() => navigate(-1)}
                        variant="ghost"
                        size="sm"
                        className="mb-6 flex items-center gap-2 text-gray-300 hover:text-white"
                    >
                        <ChevronLeftIcon className="w-4 h-4" />
                        Voltar ao Hub
                    </Button>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Capa da obra */}
                        <div className="flex-shrink-0">
                            <div className="w-48 h-72 mx-auto lg:mx-0">
                                <Image
                                    src={readerData.cover}
                                    alt={readerData.title}
                                    className="w-full h-full object-cover rounded-lg shadow-2xl"
                                />
                            </div>
                        </div>

                        {/* Informações da obra */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                                    {readerData.title}
                                </h1>
                                
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                                    {readerData.author && (
                                        <span>Por: {readerData.author}</span>
                                    )}
                                    {readerData.artist && readerData.artist !== readerData.author && (
                                        <span>Arte: {readerData.artist}</span>
                                    )}
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        readerData.status === 'Em Andamento' ? 'bg-green-900 text-green-300' :
                                        readerData.status === 'Completo' ? 'bg-blue-900 text-blue-300' :
                                        'bg-gray-700 text-gray-300'
                                    }`}>
                                        {readerData.status}
                                    </span>
                                </div>
                            </div>

                            {/* Estatísticas */}
                            <div className="flex flex-wrap gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <BookOpenIcon className="w-4 h-4" />
                                    <span>{displayedChapters.length} capítulos</span>
                                </div>
                            </div>

                            {/* Botão principal de leitura */}
                            <div className="flex gap-4">
                                {displayedChapters.length > 0 && (
                                    <Button
                                        onClick={() => handleReadChapter(displayedChapters[displayedChapters.length - 1].id)}
                                        size="lg"
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                                    >
                                        <PlayIcon className="w-5 h-5" />
                                        Começar a Ler
                                    </Button>
                                )}
                            </div>

                            {/* Descrição */}
                            {readerData.description && (
                                <div className="prose prose-invert max-w-none">
                                    <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                                        {readerData.description}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de Capítulos */}
            <div className="container mx-auto px-6 pb-12">
                <div className="bg-gray-800 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold">Capítulos</h2>
                        {displayedChapters.length > 20 && (
                            <Button
                                onClick={() => setShowAllChapters(!showAllChapters)}
                                variant="outline"
                                size="sm"
                            >
                                {showAllChapters ? 'Mostrar Menos' : `Ver Todos (${Object.keys(readerData.chapters).length})`}
                            </Button>
                        )}
                    </div>

                    {displayedChapters.length > 0 ? (
                        <div className="space-y-2">
                            {displayedChapters.map((chapter) => (
                                <div
                                    key={chapter.id}
                                    className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    <div className="flex-1">
                                        <h3 className="font-medium text-white">
                                            {chapter.title}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                            {chapter.volume && (
                                                <span>Vol. {chapter.volume}</span>
                                            )}
                                            <span>{formatDate(chapter.last_updated)}</span>
                                            <span>{getPageCount(chapter)} páginas</span>
                                            {chapter.groups && Object.keys(chapter.groups).length > 0 && (
                                                <span>Por: {Object.keys(chapter.groups).join(', ')}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {chapter.isRead && (
                                            <CheckIcon className="w-5 h-5 text-green-400" />
                                        )}
                                        
                                        <Button
                                            onClick={() => handleReadChapter(chapter.id)}
                                            size="sm"
                                            className="flex items-center gap-2"
                                        >
                                            <PlayIcon className="w-4 h-4" />
                                            {chapter.isRead ? 'Reler' : 'Ler'}
                                        </Button>

                                        {!chapter.isRead && (
                                            <Button
                                                onClick={() => handleMarkAsRead(chapter.id)}
                                                variant="outline"
                                                size="sm"
                                            >
                                                Marcar como Lido
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            <BookOpenIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhum capítulo disponível</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReaderView;
