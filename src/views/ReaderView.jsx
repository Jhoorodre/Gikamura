import React, { Suspense, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';
const ItemViewer = React.lazy(() => import('../components/item/ItemViewer.jsx'));

const ReaderView = () => {
    const { slug, entryKey } = useParams();
    const navigate = useNavigate();
    const { selectedItemData, selectItem, itemLoading, itemError, currentHubData } = useAppContext();
    
    // Adicione um estado local para a página atual
    const [page, setPage] = useState(0);

    const itemFromHub = currentHubData?.series.find(i => i.slug === slug);

    useEffect(() => {
        // Se não temos o item selecionado ou é o item errado, busca os dados corretos
        if (itemFromHub && (!selectedItemData || selectedItemData.slug !== slug)) {
            selectItem(itemFromHub, currentHubData.hub.id);
        }
    }, [itemFromHub, selectedItemData, slug, selectItem, currentHubData?.hub?.id]);

    // Exibe o spinner enquanto os dados do item estão sendo carregados
    if (itemLoading || !selectedItemData || selectedItemData.slug !== slug) {
        return <Spinner text="Carregando dados da série..." />;
    }
    
    if (itemError) {
        return <ErrorMessage message={itemError} onRetry={() => selectItem(itemFromHub, currentHubData.hub.id)} />;
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
                readingMode={'paginated'} // Modo de leitura inicial
                setReadingMode={() => {}} // A lógica para isso pode ser adicionada aqui se necessário
                isFirstEntry={isFirstEntry}
                isLastEntry={isLastEntry}
                onNextEntry={onNextEntry}
                onPrevEntry={onPrevEntry}
            />
        </Suspense>
    );
};

export default ReaderView;
