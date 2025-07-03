// AIDEV-NOTE: Collection page showing user's pinned and historical items with navigation
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import ItemGrid from '../components/item/ItemGrid';
import { encodeUrl } from '../utils/encoding';
import ProtectedRoute from '../components/common/ProtectedRoute';

const CollectionPage = () => {
    const { 
        pinnedItems, 
        historyItems, 
        togglePinStatus, 
        currentHubData, 
        selectItem 
    } = useAppContext();
    const navigate = useNavigate();

    // AIDEV-NOTE: Navigates to item details with proper hub context validation
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
            <div className="page-container fade-in">
                <header className="page-header">
                    <span className="page-icon">📚</span>
                    <h1 className="page-title orbitron">Minha Coleção</h1>
                </header>
                
                {/* AIDEV-NOTE: Historical items section with empty state handling */}
                <section className="page-section">
                    <h2 className="section-title">
                        📖 Histórico de Navegação
                    </h2>
                    
                    {historyItems.length > 0 ? (
                        <div className="item-grid">
                            <ItemGrid
                                items={historyItems}
                                onSelectItem={handleSelectItem}
                                onPinToggle={togglePinStatus}
                            />
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">📖</div>
                            <h3 className="empty-state-title">Histórico Vazio</h3>
                            <p className="empty-state-description">
                                Seu histórico de navegação está vazio. Explore os hubs para que os itens visitados apareçam aqui automaticamente.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </ProtectedRoute>
    );
};

export default CollectionPage;
