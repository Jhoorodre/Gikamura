import React, { Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Spinner from '../components/common/Spinner';
const ItemViewer = React.lazy(() => import('../components/item/ItemViewer.jsx'));

const ReaderView = () => {
    const { slug, entryKey } = useParams();
    const navigate = useNavigate();
    const { currentHubData, selectedItemData, selectItem } = useAppContext();
    const item = currentHubData?.series.find(i => i.slug === slug);
    React.useEffect(() => {
        if (item && (!selectedItemData || selectedItemData.slug !== slug)) {
            selectItem(item);
        }
    }, [item, slug]);
    if (!item || !item.entries || !item.entries[entryKey]) {
        return <Spinner text="A carregar capítulo..." />;
    }
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
            <ItemViewer
                itemData={item}
                entry={item.entries[entryKey]}
                page={0}
                setPage={() => {}}
                onBack={() => navigate(`/series/${item.slug}`)}
                readingMode={'paginated'}
                setReadingMode={() => {}}
                isFirstEntry={false}
                isLastEntry={false}
                onNextEntry={() => {}}
                onPrevEntry={() => {}}
            />
        </Suspense>
    );
};

export default ReaderView;
