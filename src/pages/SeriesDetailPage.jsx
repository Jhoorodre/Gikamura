import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReader } from '../hooks/useReader';
import { decodeUrl } from '../utils/encoding';
import { BookOpenIcon, PlayIcon, ClockIcon, CheckIcon } from '../components/common/Icones';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';
import Image from '../components/common/Image';

const SeriesDetailPage = () => {
    const { encodedUrl } = useParams();
    const navigate = useNavigate();
    const [showAllChapters, setShowAllChapters] = useState(false);
    
    const {
        readerData,
        isLoading,
        error,
        loadReader,
        selectChapter,
        markChapterAsRead,
        utils
    } = useReader();

    // Decodifica URL e carrega dados
    useEffect(() => {
        if (encodedUrl) {
            try {
                const decodedUrl = decodeUrl(encodedUrl);
                console.log('📖 Carregando obra:', decodedUrl);
                loadReader(decodedUrl);
            } catch (error) {
                console.error('❌ Erro ao decodificar URL:', error);
            }
        }
    }, [encodedUrl, loadReader]);

    // Lista de capítulos com limite
    const displayedChapters = useMemo(() => {
        if (!readerData?.chapterList) return [];
        
        const chapters = [...readerData.chapterList].reverse(); // Mais recentes primeiro
        return showAllChapters ? chapters : chapters.slice(0, 10);
    }, [readerData?.chapterList, showAllChapters]);

    const handleReadChapter = (chapterId) => {
        console.log('🎯 Iniciando leitura do capítulo:', chapterId);
        selectChapter(chapterId);
        // Navega para a página de leitura com o capítulo selecionado
        navigate(`/read/${encodedUrl}/${encodeURIComponent(chapterId)}`);
    };

    const handleMarkAsRead = async (chapterId) => {
        await markChapterAsRead(chapterId);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <Spinner size="lg" text="Carregando obra..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
                <div className="max-w-md w-full">
                    <ErrorMessage 
                        message={`Erro ao carregar obra: ${error.message}`}
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
                    <p>Nenhuma obra carregada</p>
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

                <div className="relative z-10 container mx-auto px-6 pt-20 pb-12">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Capa da obra */}
                        <div className="flex-shrink-0">
                            <div className="w-48 h-72 mx-auto lg:mx-0">
                                <Image
                                    src={readerData.cover}
                                    alt={readerData.title}
                                    className="w-full h-full object-cover rounded-lg"
                                    fallback="/placeholder-cover.jpg"
                                />
                            </div>
                        </div>

                        {/* Informações da obra */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                                    {readerData.title}
                                </h1>
                                
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                                    {readerData.author && (
                                        <span>Autor: {readerData.author}</span>
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
                                    <span>{readerData.stats.totalChapters} capítulos</span>
                                </div>
                                {readerData.stats.readChapters > 0 && (
                                    <div className="flex items-center gap-2">
                                        <CheckIcon className="w-4 h-4 text-green-400" />
                                        <span>{readerData.stats.readChapters} lidos</span>
                                    </div>
                                )}
                                {readerData.stats.lastUpdated && (
                                    <div className="flex items-center gap-2">
                                        <ClockIcon className="w-4 h-4" />
                                        <span>Atualizado em {readerData.stats.lastUpdated}</span>
                                    </div>
                                )}
                            </div>

                            {/* Botão principal de leitura */}
                            <div className="flex gap-4">
                                {readerData.chapterList && readerData.chapterList.length > 0 && (
                                    <Button
                                        onClick={() => {
                                            // Se há progresso, continua do próximo não lido, senão começa do primeiro
                                            const nextChapter = readerData.chapterList.find(ch => !ch.isRead) || readerData.chapterList[0];
                                            handleReadChapter(nextChapter.id);
                                        }}
                                        size="lg"
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                                    >
                                        <PlayIcon className="w-5 h-5" />
                                        {readerData.stats.readChapters > 0 ? 'Continuar Leitura' : 'Começar a Ler'}
                                    </Button>
                                )}
                                
                                {/* AIDEV-NOTE: Minimalist back to hub button - visible but clean design */}
                                <Button
                                    onClick={() => navigate(-1)}
                                    variant="outline"
                                    size="sm"
                                    className="text-white hover:bg-gray-800 border-gray-600 hover:border-gray-500 px-3 py-2 flex items-center gap-2"
                                    title="Voltar ao Hub"
                                >
                                    <ChevronLeftIcon className="w-4 h-4" />
                                    <span className="text-sm">Hub</span>
                                </Button>
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

            {/* Lista de capítulos */}
            <div className="container mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Capítulos</h2>
                    {readerData.chapterList.length > 10 && (
                        <Button
                            onClick={() => setShowAllChapters(!showAllChapters)}
                            variant="outline"
                            size="sm"
                        >
                            {showAllChapters ? 'Mostrar Menos' : `Ver Todos (${readerData.chapterList.length})`}
                        </Button>
                    )}
                </div>

                {displayedChapters.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <BookOpenIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum capítulo disponível</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {displayedChapters.map((chapter) => (
                            <div
                                key={chapter.id}
                                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                                    chapter.isRead
                                        ? 'bg-gray-800/50 border-gray-700 text-gray-400'
                                        : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                                }`}
                            >
                                <div className="flex-1">
                                    <h3 className="font-medium">
                                        {chapter.title}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                        {chapter.volume && (
                                            <span>Vol. {chapter.volume}</span>
                                        )}
                                        <span>{chapter.relativeTime}</span>
                                        <span>{chapter.pageCount} páginas</span>
                                        {chapter.groups.length > 0 && (
                                            <span>Por: {chapter.groups.join(', ')}</span>
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
                )}
            </div>
        </div>
    );
};

export default SeriesDetailPage;
