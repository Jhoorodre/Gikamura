// AIDEV-NOTE: Página Coleção para gerenciar hubs salvos (não séries)
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { encodeUrl } from '../utils/encoding';
import ProtectedRoute from '../components/common/ProtectedRoute';
import HubHistory from '../components/hub/HubHistory';
import '../styles/minimalist-pages.css';

const CollectionPage = () => {
    const { savedHubs, removeHub } = useAppContext();
    const navigate = useNavigate();

    // AIDEV-NOTE: Navega para o hub selecionado via query parameter
    const handleSelectHub = (hub) => {
        try {
            const encodedHubUrl = encodeUrl(hub.url);
            // AIDEV-NOTE: Carrega hub na mesma aba via query parameter
            navigate(`/?hub=${encodedHubUrl}`);
        } catch (error) {
            console.error("Erro ao navegar para o hub:", error);
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-page-container">
                <div className="min-content-wrapper">
                    <div className="min-header">
                        <h1 className="min-title">Coleção</h1>
                        <p className="min-subtitle">Seus hubs salvos para acesso rápido.</p>
                    </div>
                    
                    {savedHubs && savedHubs.length > 0 ? (
                        <div className="hub-collection-container">
                            <HubHistory 
                                hubs={savedHubs}
                                onSelectHub={handleSelectHub}
                                onRemoveHub={removeHub}
                            />
                        </div>
                    ) : (
                        <div className="min-empty-state">
                            <span className="min-empty-icon">🌐</span>
                            <h3 className="min-empty-title">Nenhum Hub Salvo</h3>
                            <p className="min-empty-description">
                                Conecte-se ao RemoteStorage e carregue hubs no Hub Loader para salvá-los aqui.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default CollectionPage;
