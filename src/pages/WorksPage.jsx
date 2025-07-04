// AIDEV-NOTE: Página Obras minimalista, exibe obras favoritas do usuário
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import ItemGrid from '../components/item/ItemGrid';
import { encodeUrl } from '../utils/encoding';
import ProtectedRoute from '../components/common/ProtectedRoute';
import '../styles/minimalist-pages.css';

const WorksPage = () => {
    const { pinnedItems, togglePinStatus, currentHubData, selectItem } = useAppContext();
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
                        <h1 className="min-title">Obras Favoritas</h1>
                        <p className="min-subtitle">Suas obras salvas para acesso rápido.</p>
                    </div>
                    {pinnedItems.length > 0 ? (
                        <ItemGrid
                            items={pinnedItems}
                            onSelectItem={handleSelectItem}
                            onPinToggle={togglePinStatus}
                        />
                    ) : (
                        <div className="min-empty-state">
                            <span className="min-empty-icon">⭐</span>
                            <h3 className="min-empty-title">Nenhuma Obra Favorita</h3>
                            <p className="min-empty-description">
                                Use o ícone de estrela para favoritar suas obras preferidas.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default WorksPage;
