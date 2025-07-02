import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useRemoteStorageContext } from '../context/RemoteStorageContext';
import ItemGrid from '../components/item/ItemGrid';
import { BookOpenIcon } from '../components/common/Icones';
import { encodeUrl } from '../utils/encoding';
import { JSONUtils } from '../services/jsonReader.js';
import '../styles/hub-minimal.css';

const HubView = () => {
    const { currentHubData, selectItem, togglePinStatus } = useAppContext();
    const { isConnected, isSyncing, forceSync, canSync } = useRemoteStorageContext() || { 
        isConnected: false, 
        isSyncing: false, 
        forceSync: () => {}, 
        canSync: () => false 
    };
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [sortBy, setSortBy] = useState('title');
    const [showDisconnectedStatus, setShowDisconnectedStatus] = useState(true);
    const [showConnectedStatus, setShowConnectedStatus] = useState(false);
    const navigate = useNavigate();
    
    // Ref para controlar logs excessivos
    const lastLogRef = useRef(null);
    const renderCountRef = useRef(0);

    // Timer para auto-fechar o popup de desconectado
    useEffect(() => {
        if (!isConnected && showDisconnectedStatus) {
            const timer = setTimeout(() => {
                setShowDisconnectedStatus(false);
            }, 5000); // 5 segundos
            
            return () => clearTimeout(timer);
        }
    }, [isConnected, showDisconnectedStatus]);

    // Exibe status conectado por 5 segundos apenas quando conecta
    const prevIsConnectedRef = useRef(isConnected);
    useEffect(() => {
        if (!prevIsConnectedRef.current && isConnected) {
            setShowConnectedStatus(true);
            const timer = setTimeout(() => {
                setShowConnectedStatus(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
        prevIsConnectedRef.current = isConnected;
    }, [isConnected]);

    // Log controlado para debug (apenas quando há mudanças significativas)
    const currentDataSignature = currentHubData ? `${currentHubData.hub?.title}-${currentHubData.series?.length}` : 'no-data';
    if (lastLogRef.current !== currentDataSignature) {
        renderCountRef.current += 1;
        console.log(`🎯 [HubView] Render #${renderCountRef.current} - Data:`, { 
            hasData: !!currentHubData, 
            title: currentHubData?.hub?.title,
            seriesCount: currentHubData?.series?.length,
            isConnected: isConnected // Adicionar log do isConnected
        });
        lastLogRef.current = currentDataSignature;
    }

    // Extrai metadados do hub
    const hubInfo = useMemo(() => {
        if (!currentHubData) return null;
        
        return {
            ...currentHubData.hub,
            meta: currentHubData.meta,
            stats: {
                seriesCount: currentHubData._metadata?.seriesCount || 0,
                lastUpdated: JSONUtils.formatTimestamp(currentHubData.meta?.lastUpdated),
                loadedAt: currentHubData._metadata?.loadedAt
            }
        };
    }, [currentHubData]);

    // Lista todas as séries com filtragem inteligente
    const allSeries = useMemo(() => {
        return currentHubData?.series || [];
    }, [currentHubData?.series]);

    // Extrai gêneros únicos para filtros
    const availableGenres = useMemo(() => {
        const genres = new Set();
        allSeries.forEach(series => {
            series.genres?.forEach(genre => genres.add(genre));
        });
        return Array.from(genres).sort();
    }, [allSeries]);

    // Aplica filtros usando o utilitário do jsonReader
    const filteredSeries = useMemo(() => {
        return JSONUtils.filterSeries(allSeries, {
            search: searchTerm,
            genres: selectedGenres,
            sortBy
        });
    }, [allSeries, searchTerm, selectedGenres, sortBy]);

    // Séries em destaque (featured)
    const featuredSeries = useMemo(() => {
        return allSeries.filter(series => series.featured === true);
    }, [allSeries]);

    const handleSelectItem = useCallback(async (item) => {
        if (!item.data?.url) {
            console.error('❌ Série não possui URL de dados válida:', item);
            return;
        }

        if (process.env.NODE_ENV === 'development') {
            console.log('🎯 Selecionando série:', item.title);
        }
        
        // Codifica URL do reader.json para navegação direta ao leitor
        const encodedReaderUrl = encodeUrl(item.data.url);
        selectItem(item, currentHubData.hub.id);
        navigate(`/reader/${encodedReaderUrl}`);
    }, [selectItem, currentHubData?.hub?.id, navigate]);

    const handleSyncClick = useCallback(async () => {
        if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Botão de sync clicado');
        }
        
        if (!canSync()) {
            console.warn('⚠️ Sincronização não pode ser executada no momento');
            return;
        }
        
        const success = await forceSync();
        if (process.env.NODE_ENV === 'development') {
            if (success) {
                console.log('✅ Sincronização iniciada com sucesso');
            } else {
                console.error('❌ Falha ao iniciar sincronização');
            }
        }
    }, [forceSync, canSync]);

    return (
        <div className="hub-view" data-connected={isConnected}>
            <div className="hub-container">
                {currentHubData?.hub ? (
                    <>
                        {/* Header Principal */}
                        <div className="hub-minimal-header">
                            <div className="hub-title-section">
                                {currentHubData.hub.icon && (
                                    <img 
                                        src={currentHubData.hub.icon.url} 
                                        alt={currentHubData.hub.icon.alt || currentHubData.hub.title}
                                        className="hub-icon"
                                    />
                                )}
                                <div className="hub-title-text">
                                    <h1 className="hub-title">{currentHubData.hub.title}</h1>
                                    {currentHubData.hub.subtitle && (
                                        <p className="hub-subtitle">{currentHubData.hub.subtitle}</p>
                                    )}
                                </div>
                            </div>
                            {currentHubData.hub.description && (
                                <p className="hub-description">{currentHubData.hub.description}</p>
                            )}
                        </div>

                        {/* Status de Conexão */}
                        <div className="hub-connection-status">
                            {isConnected && (isSyncing || showConnectedStatus) ? (
                                <div className="status-card connected">
                                    <div className="status-dot"></div>
                                    <span className="status-text">
                                        {isSyncing
                                            ? "🔄 Sincronizando..."
                                            : (showConnectedStatus && "✅ Remote Storage Conectado")}
                                    </span>
                                    {!isSyncing && showConnectedStatus && (
                                        <button 
                                            className="hub-btn"
                                            onClick={handleSyncClick}
                                            disabled={!canSync()}
                                            title="Forçar sincronização"
                                        >
                                            🔄 Sync
                                        </button>
                                    )}
                                </div>
                            ) : (
                                !isConnected && showDisconnectedStatus && (
                                    <div className="status-card disconnected">
                                        <div className="status-dot"></div>
                                        <span className="status-text">⚠️ Remote Storage Desconectado</span>
                                        <button 
                                            className="hub-btn"
                                            onClick={() => setShowDisconnectedStatus(false)}
                                            title="Fechar notificação"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )
                            )}
                        </div>

                        {/* Cards de Navegação - apenas quando conectado */}
                        {isConnected && (
                            <div className="hub-nav-grid">
                                <Link to="/collection" className="hub-nav-card" aria-label="Ir para coleção">
                                    <div className="hub-nav-icon" aria-hidden="true">📚</div>
                                    <div className="hub-nav-content">
                                        <h3 className="hub-nav-title">Coleção</h3>
                                        <p className="hub-nav-desc">Itens favoritados</p>
                                    </div>
                                </Link>
                                <Link to="/works" className="hub-nav-card" aria-label="Ir para obras">
                                    <div className="hub-nav-icon" aria-hidden="true">★</div>
                                    <div className="hub-nav-content">
                                        <h3 className="hub-nav-title">Obras</h3>
                                        <p className="hub-nav-desc">Conteúdo especial</p>
                                    </div>
                                </Link>
                                <Link to="/upload" className="hub-nav-card" aria-label="Ir para upload">
                                    <div className="hub-nav-icon" aria-hidden="true">⇧</div>
                                    <div className="hub-nav-content">
                                        <h3 className="hub-nav-title">Upload</h3>
                                        <p className="hub-nav-desc">Enviar conteúdo</p>
                                    </div>
                                </Link>
                            </div>
                        )}

                        {/* Seção de Séries */}
                        <div className="hub-series-section">
                            <div className="hub-series-header">
                                <h2 className="hub-series-title">Séries Disponíveis</h2>
                                <div className="hub-series-count">
                                    {filteredSeries.length} {filteredSeries.length === 1 ? 'série' : 'séries'}
                                </div>
                            </div>

                            {/* Controles de Busca e Filtro */}
                            <div className="hub-filters">
                                <input
                                    type="text"
                                    placeholder="Buscar séries..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="hub-search-box"
                                />
                            </div>

                            {/* Grid de Séries */}
                            {filteredSeries.length > 0 ? (
                                <div className="hub-series-grid">
                                    <ItemGrid
                                        items={filteredSeries}
                                        onSelectItem={handleSelectItem}
                                        onPinToggle={togglePinStatus}
                                    />
                                </div>
                            ) : (
                                <div className="hub-empty-state">
                                    {searchTerm ? (
                                        <>
                                            <div className="hub-empty-state-icon">🔍</div>
                                            <h3 className="hub-empty-state-title">Nenhum resultado encontrado</h3>
                                            <p className="hub-empty-state-description">
                                                Não encontramos séries com o termo "{searchTerm}".
                                            </p>
                                            <button 
                                                className="hub-btn hub-btn-primary"
                                                onClick={() => setSearchTerm("")}
                                            >
                                                Limpar pesquisa
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="hub-empty-state-icon">📚</div>
                                            <h3 className="hub-empty-state-title">Nenhuma série disponível</h3>
                                            <p className="hub-empty-state-description">
                                                Este hub ainda não possui séries cadastradas.
                                            </p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="hub-empty-state">
                        <div className="hub-empty-state-icon">🌐</div>
                        <h2 className="hub-empty-state-title">Hub não encontrado</h2>
                        <p className="hub-empty-state-description">
                            Não foi possível carregar os dados do hub.
                        </p>
                        <Link to="/" className="hub-btn hub-btn-primary">
                            Voltar ao início
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HubView;
