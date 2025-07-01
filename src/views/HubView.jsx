import { useState, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useRemoteStorageContext } from '../context/RemoteStorageContext';
import HubHeader from '../components/hub/HubHeader';
import ItemGrid from '../components/item/ItemGrid';
import { BookOpenIcon } from '../components/common/Icones';
import { encodeUrl } from '../utils/encoding';

const HubView = () => {
    const { currentHubData, selectItem, togglePinStatus } = useAppContext();
    const { isConnected } = useRemoteStorageContext() || { isConnected: false };
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    const allItems = useMemo(() => {
        return currentHubData?.series || [];
    }, [currentHubData?.series]);

    const filteredSeries = useMemo(() => {
        if (!allItems) {
            return [];
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return allItems.filter(item =>
            item.title.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }, [allItems, searchTerm]);

    const handleSelectItem = useCallback(async (item) => {
        const uniqueId = `${currentHubData.hub.id}:${item.slug}`;
        const encodedId = encodeUrl(uniqueId);
        selectItem(item, currentHubData.hub.id);
        navigate(`/series/${encodedId}`);
    }, [selectItem, currentHubData?.hub?.id, navigate]);

    return (
        <div className="page-container">
            {/* Status de Conexão */}
            <div className="connection-status">
                {!isConnected ? (
                    <div className="status-indicator status-warning">
                        <div className="status-dot"></div>
                        <div className="status-content">
                            <span className="status-title">Remote Storage Desconectado</span>
                            <span className="status-subtitle">Conecte-se para acessar todas as funcionalidades</span>
                        </div>
                    </div>
                ) : (
                    <div className="status-indicator status-success">
                        <div className="status-dot"></div>
                        <span className="status-title">Remote Storage Conectado</span>
                    </div>
                )}
            </div>

            {/* Cards de Navegação - só quando conectado */}
            {isConnected && (
                <div className="hub-nav-section">
                    <div className="nav-cards-grid">
                        <Link to="/collection" className="nav-card nav-card-collection">
                            <div className="nav-card-icon">
                                <BookOpenIcon />
                            </div>
                            <div className="nav-card-content">
                                <h3>Coleção</h3>
                                <p>Itens favoritados</p>
                            </div>
                        </Link>

                        <Link to="/works" className="nav-card nav-card-works">
                            <div className="nav-card-icon">
                                <span className="text-2xl">⭐</span>
                            </div>
                            <div className="nav-card-content">
                                <h3>Obras</h3>
                                <p>Obras pinadas</p>
                            </div>
                        </Link>

                        <Link to="/upload" className="nav-card nav-card-upload">
                            <div className="nav-card-icon">
                                <span className="text-2xl">📤</span>
                            </div>
                            <div className="nav-card-content">
                                <h3>Upload</h3>
                                <p>Enviar conteúdo</p>
                            </div>
                        </Link>

                        <div className="nav-card nav-card-placeholder">
                            <div className="nav-card-icon">
                                <span className="text-2xl opacity-50">✨</span>
                            </div>
                            <div className="nav-card-content">
                                <h3 className="opacity-50">Em breve</h3>
                                <p className="opacity-50">Novidades...</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Conteúdo Principal do Hub */}
            <div className="page-section">
                {currentHubData?.hub ? (
                    <>
                        <HubHeader hub={currentHubData.hub} />
                        
                        {/* Área de Pesquisa */}
                        <div className="search-section">
                            <div className="search-container">
                                <input
                                    type="text"
                                    placeholder="Pesquisar séries por título..."
                                    className="form-input search-input"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <div className="search-results-info">
                                        <span className="badge badge-info">
                                            {filteredSeries.length} {filteredSeries.length === 1 ? 'resultado' : 'resultados'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Grid de Séries */}
                        <div className="series-section">
                            {filteredSeries.length > 0 ? (
                                <ItemGrid
                                    items={filteredSeries}
                                    onSelectItem={handleSelectItem}
                                    onPinToggle={togglePinStatus}
                                />
                            ) : (
                                <div className="empty-state">
                                    {searchTerm ? (
                                        <>
                                            <span className="empty-state-icon">🔍</span>
                                            <h3 className="empty-state-title">Nenhum resultado encontrado</h3>
                                            <p className="empty-state-description">
                                                Não encontramos séries com o termo "{searchTerm}".
                                            </p>
                                            <button 
                                                className="btn btn-ghost"
                                                onClick={() => setSearchTerm("")}
                                            >
                                                Limpar pesquisa
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="empty-state-icon">📚</span>
                                            <h3 className="empty-state-title">Nenhuma série disponível</h3>
                                            <p className="empty-state-description">
                                                Este hub ainda não possui séries cadastradas.
                                            </p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="empty-state">
                        <span className="empty-state-icon">🌐</span>
                        <h2 className="empty-state-title">Hub não encontrado</h2>
                        <p className="empty-state-description">
                            Não foi possível carregar os dados do hub.
                        </p>
                        <Link to="/hub-loader" className="btn btn-primary">
                            Voltar para conexão
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HubView;
