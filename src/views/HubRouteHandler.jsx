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

    useEffect(() => {
        const processHub = async () => {
            if (encodedUrl) {
                try {
                    setDebugInfo('🔓 Decodificando URL...');
                    console.log('🎯 [HubRouteHandler] Processando URL codificada:', encodedUrl);
                    
                    const decodedUrl = decodeUrl(encodedUrl);
                    console.log('🔓 [HubRouteHandler] URL decodificada:', decodedUrl);
                    
                    setDebugInfo(`📡 Carregando: ${decodedUrl}`);
                    
                    // Teste direto do fetch aqui também
                    console.log('🧪 [HubRouteHandler] Teste direto do fetch...');
                    const response = await fetch(decodedUrl);
                    console.log('🧪 [HubRouteHandler] Response status:', response.status);
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log('🧪 [HubRouteHandler] Fetch direto funcionou! Título:', data.hub?.title);
                        setDebugInfo(`✅ Fetch direto funcionou: ${data.hub?.title}`);
                    }
                    
                    await loadHub(decodedUrl);
                } catch (error) {
                    console.error('❌ [HubRouteHandler] Erro ao processar URL do hub:', error);
                    setDebugInfo(`❌ Erro: ${error.message}`);
                }
            }
        };
        
        processHub();
    }, [encodedUrl, loadHub]);

    // Mostrar loading enquanto carrega
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

    // Mostrar erro se houver
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

    // Mostrar o hub se carregado com sucesso
    if (currentHubData) {
        return <HubView />;
    }

    // Fallback para estado indefinido
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