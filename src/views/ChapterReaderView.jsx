import React, { Suspense, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReader } from '../hooks/useReader';
import { useAppContext } from '../context/AppContext';
import { decodeUrl, encodeUrl } from '../utils/encoding';
import { ChevronLeftIcon, BookOpenIcon } from '../components/common/Icones';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';
const ItemViewer = React.lazy(() => import('../components/item/ItemViewer.jsx'));

const ChapterReaderView = () => {
    // Recebe os parâmetros codificados da URL
    const { encodedUrl, chapterId } = useParams();
    const navigate = useNavigate();
    const { currentHubData, currentHubUrl } = useAppContext() || { currentHubData: null, currentHubUrl: null };
    
    const [page, setPage] = useState(0);
    const [readingMode, setReadingMode] = useState('paginated');

    // Decodifica os parâmetros
    const readerUrl = decodeUrl(encodedUrl);
    const decodedChapterId = decodeUrl(chapterId);
    
    console.log('🔍 [ChapterReaderView] chapterId original:', chapterId);
    console.log('🔍 [ChapterReaderView] decodedChapterId:', decodedChapterId);
    
    // Usa o hook useReader para carregar os dados
    const {
        readerData,
        selectedChapter,
        isLoading,
        error,
        loadReader,
        selectChapter,
        saveReadingProgress
    } = useReader();

    // Carrega o reader.json
    useEffect(() => {
        console.log('🎯 [ChapterReaderView] readerUrl:', readerUrl);
        if (readerUrl) {
            console.log('🎯 Carregando reader para capítulo:', readerUrl);
            loadReader(readerUrl);
        }
    }, [readerUrl, loadReader]);

    // Seleciona o capítulo quando os dados estão carregados
    useEffect(() => {
        if (readerData && decodedChapterId) {
            console.log('📖 Selecionando capítulo:', decodedChapterId);
            console.log('📊 [Debug] readerData disponível:', !!readerData);
            console.log('📊 [Debug] capítulos disponíveis:', readerData.chapters ? Object.keys(readerData.chapters) : 'undefined');
            console.log('📊 [Debug] capítulo específico:', readerData.chapters?.[decodedChapterId]);
            selectChapter(decodedChapterId);
        }
    }, [readerData, decodedChapterId, selectChapter]);

    // Reset página quando muda capítulo
    useEffect(() => {
        setPage(0);
    }, [decodedChapterId]);

    // Função para salvar progresso
    const handleSaveProgress = async (slug, sourceId, chapterId, currentPage) => {
        console.log('🔄 [handleSaveProgress] Chamado com:', { slug, sourceId, chapterId, currentPage });
        console.log('🔄 [handleSaveProgress] selectedChapter existe?', !!selectedChapter);
        console.log('🔄 [handleSaveProgress] selectedChapter.pages:', selectedChapter?.pages?.length || 'undefined');
        
        try {
            if (saveReadingProgress && selectedChapter && selectedChapter.pages) {
                // Garantir que currentPage seja um número
                const pageIndex = parseInt(currentPage, 10);
                const totalPages = selectedChapter.pages.length;
                
                console.log(`💾 Salvando progresso - Capítulo: ${decodedChapterId}, Página: ${pageIndex + 1}/${totalPages}`);
                
                // Só salvar se o capítulo tem páginas 
                if (totalPages > 0) {
                    await saveReadingProgress(decodedChapterId, pageIndex, totalPages);
                    console.log('✅ [handleSaveProgress] Progresso salvo com sucesso');
                } else {
                    console.warn('⚠️ Capítulo sem páginas, não salvando progresso');
                }
            } else {
                console.warn('⚠️ [handleSaveProgress] Condições não atendidas:', {
                    saveReadingProgress: !!saveReadingProgress,
                    selectedChapter: !!selectedChapter,
                    hasPages: !!selectedChapter?.pages
                });
            }
        } catch (error) {
            console.error('❌ [handleSaveProgress] Erro ao salvar progresso:', error);
        }
    };

    // Wrapper para o ItemViewer - recebe apenas a página atual
    const handleItemViewerSaveProgress = async (currentPage) => {
        const slug = readerData?.title || 'manga';
        const sourceId = 'reader';
        return handleSaveProgress(slug, sourceId, decodedChapterId, currentPage);
    };

    // Navegação entre capítulos
    const getChaptersList = () => {
        if (!readerData?.chapters) return [];
        return Object.keys(readerData.chapters).sort();
    };

    // AIDEV-NOTE: Smart navigation back to hub logic
    const handleBackToHub = () => {
        if (currentHubData && currentHubUrl) {
            // AIDEV-NOTE: Navigate to current loaded hub (never exposes raw/json URL)
            const encodedHubUrl = encodeUrl(currentHubUrl);
            navigate(`/hub/${encodedHubUrl}`);
        } else {
            // AIDEV-NOTE: No hub loaded, go to Hub Loader
            navigate('/');
        }
    };

    const currentChapterIndex = getChaptersList().findIndex(id => id === decodedChapterId);
    const nextChapter = getChaptersList()[currentChapterIndex + 1];
    const prevChapter = getChaptersList()[currentChapterIndex - 1];

    const handleNextChapter = () => {
        if (nextChapter) {
            navigate(`/read/${encodedUrl}/${encodeUrl(nextChapter)}`);
        }
    };

    const handlePrevChapter = () => {
        if (prevChapter) {
            navigate(`/read/${encodedUrl}/${encodeUrl(prevChapter)}`);
        }
    };

    const handleBackToChapterList = () => {
        navigate(`/reader/${encodedUrl}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Spinner size="lg" />
                    <p className="mt-4 text-gray-400">Carregando capítulo...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center">
                    <ErrorMessage 
                        message={`Erro ao carregar capítulo: ${error.message}`}
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
                            onClick={handleBackToChapterList}
                            variant="secondary"
                            className="w-full"
                        >
                            Voltar aos capítulos
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!selectedChapter) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center text-gray-400">
                    <BookOpenIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-4">Capítulo não encontrado</p>
                    <Button
                        onClick={handleBackToChapterList}
                        variant="primary"
                    >
                        Voltar aos capítulos
                    </Button>
                </div>
            </div>
        );
    }

    // Log dos dados do capítulo para debug
    console.log('🔍 Dados do capítulo:', selectedChapter);
    console.log('🔍 Groups disponíveis:', Object.keys(selectedChapter.groups || {}));
    
    // Extrai as páginas do primeiro grupo disponível
    const groupKeys = Object.keys(selectedChapter.groups || {});
    const pages = groupKeys.length > 0 ? selectedChapter.groups[groupKeys[0]] : [];
    
    console.log('🔍 Imagens encontradas:', pages.length, 'URLs:', pages.slice(0, 3));

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Header com navegação */}
            <div className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                onClick={handleBackToChapterList}
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white"
                            >
                                <ChevronLeftIcon className="w-5 h-5 mr-2" />
                                Capítulos
                            </Button>
                            
                            <div className="text-white">
                                <h1 className="font-semibold">
                                    {selectedChapter.title || `Capítulo ${decodedChapterId}`}
                                </h1>
                                <p className="text-sm text-gray-400">
                                    {readerData?.title}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* AIDEV-NOTE: Minimalist back to hub button - visible but clean design */}
                            <Button
                                onClick={() => navigate('/')}
                                variant="outline"
                                size="sm"
                                className="text-white hover:bg-gray-800 border-gray-600 hover:border-gray-500 px-2 py-1 flex items-center gap-1"
                                title="Voltar ao Hub"
                            >
                                <ChevronLeftIcon className="w-3 h-3" />
                                <span className="text-xs">Hub</span>
                            </Button>
                            {/* AIDEV-NOTE: Serie button - navigate to hub (all mangas) page */}
                            <Button
                                onClick={() => {
                                    if (currentHubData && currentHubUrl) {
                                        // Navigate to current loaded hub
                                        const encodedHubUrl = encodeUrl(currentHubUrl);
                                        navigate(`/hub/${encodedHubUrl}`);
                                    } else {
                                        // No hub loaded, go to Hub Loader
                                        navigate('/');
                                    }
                                }}
                                variant="outline"
                                size="sm"
                                className="text-white hover:bg-gray-800 border-gray-600 hover:border-gray-500 px-2 py-1"
                                title="Voltar ao hub (todos os mangás)"
                            >
                                Série
                            </Button>
                            <Button
                                onClick={handlePrevChapter}
                                disabled={!prevChapter}
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white disabled:opacity-50"
                            >
                                Anterior
                            </Button>
                            <Button
                                onClick={handleNextChapter}
                                disabled={!nextChapter}
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white disabled:opacity-50"
                            >
                                Próximo
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Leitor de páginas */}
            <div className="reader-content">
                <Suspense fallback={
                    <div className="min-h-screen flex items-center justify-center">
                        <Spinner size="lg" />
                    </div>
                }>
                    <ItemViewer
                        entry={selectedChapter}
                        page={page}
                        setPage={setPage}
                        onBack={handleBackToChapterList}
                        readingMode={readingMode}
                        setReadingMode={setReadingMode}
                        onNextEntry={handleNextChapter}
                        onPrevEntry={handlePrevChapter}
                        isFirstEntry={!prevChapter}
                        isLastEntry={!nextChapter}
                        itemData={{
                            slug: readerData?.title || 'manga',
                            sourceId: 'reader'
                        }}
                        entryKey={decodedChapterId}
                        onSaveProgress={handleItemViewerSaveProgress}
                    />
                </Suspense>
            </div>
        </div>
    );
};

export default ChapterReaderView;
