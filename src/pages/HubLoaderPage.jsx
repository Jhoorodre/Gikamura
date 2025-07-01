import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Spinner from '../components/common/Spinner';
import { decodeUrl } from '../utils/encoding';

function HubLoaderPage() {
    const { encodedUrl } = useParams();
    const navigate = useNavigate();
    const { loadHub } = useAppContext();

    useEffect(() => {
        const processUrl = async () => {
            if (encodedUrl) {
                try {
                    const decodedUrl = decodeUrl(encodedUrl);
                    await loadHub(decodedUrl);
                    navigate('/', { replace: true });
                } catch (error) {
                    console.error('Falha ao processar a URL do Hub:', error);
                    navigate('/', { replace: true });
                }
            }
        };
        processUrl();
    }, [encodedUrl, loadHub, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Spinner text="A carregar dados do Hub..." />
        </div>
    );
}

export default HubLoaderPage;
