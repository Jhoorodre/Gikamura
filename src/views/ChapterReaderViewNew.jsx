import React, { Suspense, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReader } from '../hooks/useReader';
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
    
    const [page, setPage] = useState(0);
    const [readingMode, setReadingMode] = useState('paginated');

    // Decodifica os parâmetros
    const readerUrl = decodeUrl(encodedUrl);
    const decodedChapterId = decodeUrl(chapterId);
    
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
        if (readerUrl) {
            console.log('🎯 Carregando reader para capítulo:', readerUrl);
            loadReader(readerUrl);
        }
    }, [readerUrl, loadReader]);

    // Seleciona o capítulo quando os dados estão carregados
    useEffect(() => {
        if (readerData && decodedChapterId) {
            console.log('📖 Selecionando capítulo:', decodedChapterId);
            selectChapter(decodedChapterId);
        }
    }, [readerData, decodedChapterId, selectChapter]);

    // Reset página quando muda capítulo
    useEffect(() => {
        setPage(0);
    }, [decodedChapterId]);

    // Função para salvar progresso
    const handleSaveProgress = async (slug, sourceId, chapterId, currentPage) => {
        try {
            if (saveReadingProgress && selectedChapter && selectedChapter.pages) {
                // Garantir que currentPage seja um número
                const pageIndex = parseInt(currentPage, 10);
                const totalPages = selectedChapter.pages.length;
                
                console.log(`💾 Salvando progresso - Capítulo: ${chapterId}, Página: ${pageIndex + 1}/${totalPages}`);
                
                if (totalPages > 0) {
                    await saveReadingProgress(chapterId, pageIndex, totalPages);
                } else {
                    console.warn('⚠️ Capítulo sem páginas, não salvando progresso');
                }
            }
        } catch (error) {
            console.error('Erro ao salvar progresso:', error);
        }
    };

    // Navegação entre capítulos
    const getChaptersList = () => {
        if (!readerData?.chapters) return [];
        return Object.keys(readerData.chapters).sort();
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
                        onSaveProgress={handleSaveProgress}
                    />
                </Suspense>
            </div>
        </div>
    );
};

export default ChapterReaderView;
