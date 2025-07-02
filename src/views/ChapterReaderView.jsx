import React, { Suspense, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReader } from '../hooks/useReader';
import { decodeUrl, encodeUrl } from '../utils/encoding';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';
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

    if (isLoading || !readerData) {
        return <Spinner text="Carregando capítulo..." />;
    }
    
    if (error) {
        return <ErrorMessage message={error.message} onRetry={() => loadReader(readerUrl)} />;
    }

    const chapter = readerData.chapters?.[decodedChapterId];
    if (!chapter) {
        return <ErrorMessage 
            message={`O capítulo "${decodedChapterId}" não foi encontrado.`} 
            onRetry={() => navigate(`/reader/${encodedUrl}`)} 
        />;
    }

    console.log('🔍 Dados do capítulo:', chapter);
    console.log('🔍 Groups disponíveis:', Object.keys(chapter.groups || {}));

    // Pega as imagens do primeiro grupo (assumindo que há pelo menos um grupo)
    const groups = chapter.groups || {};
    const groupName = Object.keys(groups)[0];
    const images = groups[groupName] || [];

    console.log('🔍 Imagens encontradas:', images.length, 'URLs:', images.slice(0, 3));

    if (images.length === 0) {
        return <ErrorMessage 
            message="Capítulo sem páginas ou com dados inválidos." 
            onRetry={() => navigate(`/reader/${encodedUrl}`)} 
        />;
    }

    // Mantém o formato original para o ItemViewer
    const entry = {
        title: chapter.title,
        groups: chapter.groups
    };

    const chapterKeys = Object.keys(readerData.chapters || {}).sort();
    const currentIndex = chapterKeys.indexOf(decodedChapterId);
    const isFirstEntry = currentIndex === 0;
    const isLastEntry = currentIndex === chapterKeys.length - 1;

    const onNextEntry = () => {
        if (!isLastEntry) {
            const nextChapterId = chapterKeys[currentIndex + 1];
            navigate(`/read/${encodedUrl}/${encodeUrl(nextChapterId)}`);
        }
    };

    const onPrevEntry = () => {
        if (!isFirstEntry) {
            const prevChapterId = chapterKeys[currentIndex - 1];
            navigate(`/read/${encodedUrl}/${encodeUrl(prevChapterId)}`);
        }
    };

    const onSaveProgress = (pageIndex) => {
        if (saveReadingProgress && entry?.pages?.length) {
            return saveReadingProgress(decodedChapterId, pageIndex, entry.pages.length);
        }
        return Promise.resolve(); // Retorna Promise resolvida se não houver função de salvamento
    };
    
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
            <ItemViewer
                itemData={readerData}
                entryKey={decodedChapterId}
                entry={entry}
                page={page}
                setPage={setPage}
                onBack={() => navigate(`/reader/${encodedUrl}`)}
                readingMode={readingMode}
                setReadingMode={setReadingMode}
                isFirstEntry={isFirstEntry}
                isLastEntry={isLastEntry}
                onNextEntry={onNextEntry}
                onPrevEntry={onPrevEntry}
                onSaveProgress={onSaveProgress}
            />
        </Suspense>
    );
};

export default ChapterReaderView;
