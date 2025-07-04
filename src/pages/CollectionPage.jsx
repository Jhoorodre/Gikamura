// AIDEV-NOTE: Página Coleção minimalista, histórico de navegação do usuário
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import ItemGrid from '../components/item/ItemGrid';
import { encodeUrl } from '../utils/encoding';
import ProtectedRoute from '../components/common/ProtectedRoute';
import '../styles/minimalist-pages.css';

const CollectionPage = () => {
    const { historyItems, togglePinStatus, currentHubData, selectItem } = useAppContext();
    const navigate = useNavigate();

    // AIDEV-NOTE: Seleciona item e navega para a página da série
    const handleSelectItem = (item) => {
        if (!currentHubData) {
            console.error("Não há um hub carregado para selecionar o item.");
            navigate('/');
            return;
        }
        const uniqueId = `${item.sourceId}:${item.slug}`;
        const encodedId = encodeUrl(uniqueId);
        selectItem(item, item.sourceId);
        navigate(`/series/${encodedId}`);
    };

    return (
        <ProtectedRoute>
            <div className="min-page-container">
                <div className="min-content-wrapper">
                    <div className="min-header">
                        <h1 className="min-title">Coleção</h1>
                        <p className="min-subtitle">Seu histórico de navegação.</p>
                    </div>
                    {historyItems.length > 0 ? (
                        <ItemGrid
                            items={historyItems}
                            onSelectItem={handleSelectItem}
                            onPinToggle={togglePinStatus}
                        />
                    ) : (
                        <div className="min-empty-state">
                            <span className="min-empty-icon">📖</span>
                            <h3 className="min-empty-title">Histórico Vazio</h3>
                            <p className="min-empty-description">
                                Explore os hubs para que os itens visitados apareçam aqui.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default CollectionPage;
