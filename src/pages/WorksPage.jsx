import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import ItemGrid from '../components/item/ItemGrid';
import { encodeUrl } from '../utils/encoding';
import ProtectedRoute from '../components/common/ProtectedRoute';

const WorksPage = () => {
    const { 
        pinnedItems, 
        togglePinStatus, 
        currentHubData, 
        selectItem 
    } = useAppContext();
    const navigate = useNavigate();

    // Função para navegar para a página de detalhes de um item
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
                    <span className="page-icon">⭐</span>
                    <h1 className="page-title orbitron">Obras Favoritas</h1>
                </header>
                
                <section className="page-section">
                    {pinnedItems.length > 0 ? (
                        <div className="item-grid">
                            <ItemGrid
                                items={pinnedItems}
                                onSelectItem={handleSelectItem}
                                onPinToggle={togglePinStatus}
                            />
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">⭐</div>
                            <h3 className="empty-state-title">Nenhuma Obra Favoritada</h3>
                            <p className="empty-state-description">
                                Você ainda não favoritou nenhuma obra. Use o botão de favorito (⭐) nos itens que desejar para acessá-los rapidamente aqui.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </ProtectedRoute>
    );
};

export default WorksPage;
