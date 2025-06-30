import React, { Suspense, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';
const ItemViewer = React.lazy(() => import('../components/item/ItemViewer.jsx'));

const ReaderView = () => {
    // Recebe os parâmetros codificados da URL
    const { encodedSeriesId, encodedEntryKey } = useParams();
    const navigate = useNavigate();
    const { selectedItemData, selectItem, itemLoading, itemError, currentHubData, setLastRead } = useAppContext();
    
    const [page, setPage] = useState(0);
    const [readingMode, setReadingMode] = useState('paginated');

    // Decodifica os parâmetros
    const entryKey = atob(encodedEntryKey);
    const [hubId, slug] = atob(encodedSeriesId).split(':');
    const itemFromHub = currentHubData?.series.find(i => i.slug === slug);

    useEffect(() => {
        if (itemFromHub && (!selectedItemData || selectedItemData.slug !== slug)) {
            selectItem(itemFromHub, hubId);
        }
    }, [itemFromHub, selectedItemData, slug, selectItem, hubId]);

    useEffect(() => {
        setPage(0);
    }, [entryKey]);

    if (itemLoading || !selectedItemData || selectedItemData.slug !== slug) {
        return <Spinner text="Carregando dados da série..." />;
    }
    
    if (itemError) {
        return <ErrorMessage message={itemError} onRetry={() => {
            if (itemFromHub && hubId) selectItem(itemFromHub, hubId);
        }} />;
    }

    const entry = selectedItemData.entries?.[entryKey];

    if (!entry) {
        return <ErrorMessage message={`O capítulo com a chave "${entryKey}" não foi encontrado.`} onRetry={() => navigate(`/series/${encodedSeriesId}`)} />;
    }

    const entryKeys = Object.keys(selectedItemData.entries || {});
    const currentIndex = entryKeys.indexOf(entryKey);
    const isFirstEntry = currentIndex === 0;
    const isLastEntry = currentIndex === entryKeys.length - 1;

    const onNextEntry = () => {
        if (!isLastEntry) {
            const nextEntryKey = entryKeys[currentIndex + 1];
            navigate(`/read/${encodedSeriesId}/${btoa(nextEntryKey)}`);
        }
    };

    const onPrevEntry = () => {
        if (!isFirstEntry) {
            const prevEntryKey = entryKeys[currentIndex - 1];
            navigate(`/read/${encodedSeriesId}/${btoa(prevEntryKey)}`);
        }
    };
    
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
            <ItemViewer
                itemData={selectedItemData}
                entryKey={entryKey}
                entry={entry}
                page={page}
                setPage={setPage}
                onBack={() => navigate(`/series/${encodedSeriesId}`)}
                readingMode={readingMode}
                setReadingMode={setReadingMode}
                isFirstEntry={isFirstEntry}
                isLastEntry={isLastEntry}
                onNextEntry={onNextEntry}
                onPrevEntry={onPrevEntry}
                onSaveProgress={setLastRead}
            />
        </Suspense>
    );
};

export default ReaderView;
