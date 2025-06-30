import React, { Suspense, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';
const ItemViewer = React.lazy(() => import('../components/item/ItemViewer.jsx'));

const ReaderView = () => {
    const { slug, entryKey } = useParams();
    const navigate = useNavigate();
    const { selectedItemData, selectItem, itemLoading, itemError, currentHubData, setLastRead } = useAppContext();
    
    // Estados locais para controlar a UI do leitor
    const [page, setPage] = useState(0);
    const [readingMode, setReadingMode] = useState('paginated');

    const itemFromHub = currentHubData?.series.find(i => i.slug === slug);

    useEffect(() => {
        // Se não temos o item selecionado ou é o item errado, busca os dados corretos
        if (itemFromHub && (!selectedItemData || selectedItemData.slug !== slug)) {
            selectItem(itemFromHub, currentHubData.hub.id);
        }
    }, [itemFromHub, selectedItemData, slug, selectItem, currentHubData]);

    // Reseta a página para 0 sempre que o capítulo (entryKey) mudar
    useEffect(() => {
        setPage(0);
    }, [entryKey]);

    // Exibe o spinner enquanto os dados do item estão sendo carregados
    if (itemLoading || !selectedItemData || selectedItemData.slug !== slug) {
        return <Spinner text="Carregando dados da série..." />;
    }
    
    if (itemError) {
        // Garante que onRetry tenha os dados necessários para tentar novamente.
        const hubIdToRetry = currentHubData?.hub?.id;
        return <ErrorMessage message={itemError} onRetry={itemFromHub && hubIdToRetry ? () => selectItem(itemFromHub, hubIdToRetry) : undefined} />;
    }

    // Usa selectedItemData (que tem a lista completa) para encontrar a 'entry'
    const entry = selectedItemData.entries?.[entryKey];

    if (!entry) {
        console.error("Capítulo não encontrado para a chave:", entryKey, "em", selectedItemData.entries);
        return <ErrorMessage message={`O capítulo com a chave "${entryKey}" não foi encontrado.`} onRetry={() => navigate(`/series/${slug}`)} />;
    }

    const entryKeys = Object.keys(selectedItemData.entries || {});
    const currentIndex = entryKeys.indexOf(entryKey);
    const isFirstEntry = currentIndex === 0;
    const isLastEntry = currentIndex === entryKeys.length - 1;

    const onNextEntry = () => {
        if (!isLastEntry) {
            navigate(`/series/${slug}/read/${entryKeys[currentIndex + 1]}`);
        }
    };

    const onPrevEntry = () => {
        if (!isFirstEntry) {
            navigate(`/series/${slug}/read/${entryKeys[currentIndex - 1]}`);
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
                onBack={() => navigate(`/series/${slug}`)}
                readingMode={readingMode}
                setReadingMode={setReadingMode}
                isFirstEntry={isFirstEntry}
                isLastEntry={isLastEntry}
                onNextEntry={onNextEntry}
                onPrevEntry={onPrevEntry}
                onSaveProgress={setLastRead} // Passa a função de salvamento da API
            />
        </Suspense>
    );
};

export default ReaderView;
