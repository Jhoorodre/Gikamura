// AIDEV-NOTE: Página Coleção para gerenciar hubs salvos, agora com layout de cards.
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { encodeUrl } from '../utils/encoding';
import ProtectedRoute from '../components/common/ProtectedRoute';
import Image from '../components/common/Image'; // AIDEV-NOTE: Importado para usar nos cards.
// AIDEV-NOTE: css-unified; minimalist-pages integrado ao sistema CSS unificado

const CollectionPage = () => {
    const { savedHubs, removeHub } = useAppContext();
    const navigate = useNavigate();

    // AIDEV-NOTE: Navega para a rota do hub ao selecionar um card.
    const handleSelectHub = (hub) => {
        try {
            const encodedHubUrl = encodeUrl(hub.url);
            navigate(`/hub/${encodedHubUrl}`);
        } catch (error) {
            console.error("Erro ao navegar para o hub:", error);
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-page-container">
                <div className="min-content-wrapper">
                    <div className="min-header">
                        <h1 className="min-title">Coleção de Hubs</h1>
                        <p className="min-subtitle">Seus hubs salvos para acesso rápido.</p>
                    </div>
                    
                    {savedHubs && savedHubs.length > 0 ? (
                        <div className="min-item-grid">
                            {savedHubs.map((hub) => (
                                <div 
                                    key={hub.url} 
                                    className="min-item-card" 
                                    onClick={() => handleSelectHub(hub)}
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleSelectHub(hub);
                                        }
                                    }}
                                >
                                    <Image
                                        src={hub.iconUrl}
                                        alt={hub.title}
                                        className="min-item-image"
                                        errorSrc="https://placehold.co/300x300/1e293b/94a3b8?text=Hub"
                                    />
                                    <div className="min-item-content">
                                        <h3 className="min-item-title">{hub.title}</h3>
                                        {!(hub.url && hub.url.trim().toLowerCase().endsWith('.json')) && (
                                            <p className="min-item-subtitle">{hub.url}</p>
                                        )}
                                    </div>
                                    <button
                                        className="min-item-delete-button"
                                        title="Remover hub"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeHub(hub.url);
                                        }}
                                    >
                                        &#x2715;
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="min-empty-state">
                            <span className="min-empty-icon">🌐</span>
                            <h3 className="min-empty-title">Nenhum Hub Salvo</h3>
                            <p className="min-empty-description">
                                Conecte-se ao RemoteStorage e carregue hubs para salvá-los aqui.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default CollectionPage;
