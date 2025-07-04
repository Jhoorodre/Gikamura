// AIDEV-NOTE: Hub route handler with URL decoding, loading states, and error handling
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Spinner from '../components/common/Spinner';
import { decodeUrl } from '../utils/encoding';
import HubView from './HubView';

const HubRouteHandler = () => {
    const { encodedUrl } = useParams();
    const navigate = useNavigate();
    const { loadHub, currentHubData, hubLoading, hubError } = useAppContext();
    const [debugInfo, setDebugInfo] = useState('');
    const [decodedUrl, setDecodedUrl] = useState(null);

    // AIDEV-NOTE: Processes encoded URL parameter and loads hub data
    useEffect(() => {
        const processHub = async () => {
            if (encodedUrl) {
                try {
                    setDebugInfo('🔓 Decodificando URL...');
                    console.log('🎯 [HubRouteHandler] Processando URL codificada:', encodedUrl);
                    
                    const url = decodeUrl(encodedUrl);
                    setDecodedUrl(url);
                    console.log('🔓 [HubRouteHandler] URL decodificada:', url);
                    
                    setDebugInfo(`📡 Carregando: ${url}`);
                    
                    // AIDEV-NOTE: Direct fetch test for debugging connectivity
                    console.log('🧪 [HubRouteHandler] Teste direto do fetch...');
                    const response = await fetch(url);
                    console.log('🧪 [HubRouteHandler] Response status:', response.status);
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log('🧪 [HubRouteHandler] Fetch direto funcionou! Título:', data.hub?.title);
                        setDebugInfo(`✅ Fetch direto funcionou: ${data.hub?.title}`);
                    }
                    
                    await loadHub(url);
                } catch (error) {
                    console.error('❌ [HubRouteHandler] Erro ao processar URL do hub:', error);
                    setDebugInfo(`❌ Erro: ${error.message}`);
                }
            }
        };
        
        processHub();
    }, [encodedUrl, loadHub]);

    // AIDEV-NOTE: Loading state with debug information
    if (hubLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <Spinner text="Carregando hub..." />
                {debugInfo && (
                    <div className="text-sm text-gray-400 text-center max-w-md">
                        {debugInfo}
                    </div>
                )}
            </div>
        );
    }

    // AIDEV-NOTE: Error state with navigation back option
    if (hubError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <div className="text-red-500 text-center">
                    <h2 className="text-xl font-bold mb-2">Erro ao carregar hub</h2>
                    <p className="text-gray-600">{hubError.message}</p>
                </div>
                {debugInfo && (
                    <div className="text-sm text-gray-400 text-center max-w-md">
                        Debug: {debugInfo}
                    </div>
                )}
                <button 
                    onClick={() => navigate('/')}
                    className="btn btn-primary"
                >
                    Voltar ao início
                </button>
            </div>
        );
    }

    // AIDEV-NOTE: Success state - show hub view with loaded data
    if (currentHubData) {
        return <HubView hubUrl={decodedUrl} />;
    }

    // AIDEV-NOTE: Fallback for undefined state
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <Spinner text="Inicializando..." />
            {debugInfo && (
                <div className="text-sm text-gray-400 text-center max-w-md">
                    {debugInfo}
                </div>
            )}
        </div>
    );
};

export default HubRouteHandler;