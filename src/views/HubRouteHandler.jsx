import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import HubView from './HubView';
import ItemGridSkeleton from '../components/item/ItemGridSkeleton';
import ErrorMessage from '../components/common/ErrorMessage';
import HubLoader from '../components/hub/HubLoaderComponent';
import { decodeUrl } from '../utils/encoding';

function HubRouteHandler() {
    const { encodedUrl } = useParams();
    const { currentHubData, hubLoading, hubError, loadHub } = useAppContext();

    useEffect(() => {
        if (encodedUrl) {
            try {
                const decodedUrl = decodeUrl(encodedUrl);
                loadHub(decodedUrl);
            } catch (e) {
                console.error("Erro ao decodificar a URL do hub:", e);
            }
        }
    }, [encodedUrl, loadHub]);

    if (hubLoading) {
        return <ItemGridSkeleton />;
    }

    if (hubError) {
        return <ErrorMessage message={hubError} onRetry={() => loadHub(decodeUrl(encodedUrl))} />;
    }

    if (currentHubData) {
        return <HubView />;
    }

    return <HubLoader />;
}

export default HubRouteHandler;
