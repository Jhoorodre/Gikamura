import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useHubContext } from '../context/HubContext';
import { useRemoteStorageContext } from '../context/RemoteStorageContext';
import ItemGrid, { ItemGridVirtualized } from '../components/item/ItemGrid';
import { BookOpenIcon } from '../components/common/Icones';
import { encodeUrl } from '../utils/encoding';
import { JSONUtils } from '../services/jsonReader.js';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';
// AIDEV-NOTE: css-unified; hub-minimal integrado ao sistema unificado via index.css

const HubView = () => {
    const { encodedUrl } = useParams();
    const navigate = useNavigate();
    const { togglePinStatus, pinnedItems, selectItem } = useAppContext();
    const { currentHubData, hubLoading, hubError } = useHubContext();
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
    
    // Ref para controlar logs excessivos
    const lastLogRef = useRef(null);
    const renderCountRef = useRef(0);

    // AIDEV-NOTE: Removed setHubUrl useEffect - hub loading is now handled by HubRouteHandler

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
            isConnected // Adicionar log do isConnected
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

    // AIDEV-NOTE: Garante que cada série do hub mantém todos os dados originais, enriquecendo apenas com o status 'pinned'.
    const allSeries = useMemo(() => {
        const seriesFromHub = currentHubData?.series || [];
        if (!seriesFromHub.length) return [];
        return seriesFromHub.map(series => ({
            ...series,
            pinned: pinnedItems.some(pinnedItem =>
                pinnedItem.slug === series.slug && pinnedItem.source === currentHubData.hub.id
            )
        }));
    }, [currentHubData?.series, pinnedItems, currentHubData?.hub?.id]);

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

    const handleSelectItem = useCallback((item) => {
        if (!item.data?.url) return;
        const encodedReaderUrl = encodeUrl(item.data.url);
        selectItem(item, currentHubData.hub.id);
        navigate(`/manga/${encodedReaderUrl}`);
    }, [selectItem, currentHubData?.hub?.id, navigate]);

    const handleSyncClick = useCallback(async () => {
        if (import.meta.env?.DEV) {
            console.log('🔄 Botão de sync clicado');
        }
        
        if (!canSync()) {
            console.warn('⚠️ Sincronização não pode ser executada no momento');
            return;
        }
        
        const success = await forceSync();
        if (import.meta.env?.DEV) {
            if (success) {
                console.log('✅ Sincronização iniciada com sucesso');
            } else {
                console.error('❌ Falha ao iniciar sincronização');
            }
        }
    }, [forceSync, canSync]);

    /**
     * ✅ CORREÇÃO: Verificação de segurança para evitar race condition ao fixar
     * Adiciona logs de debug detalhados para rastreamento do fluxo de dados.
     */
    const handlePinToggle = useCallback((item) => {
        if (!currentHubData?.hub?.id) return;
        const originalUrl = item.url || item.data?.url;
        if (!originalUrl) return;
        const itemParaApi = {
            id: item.id,
            slug: item.slug || item.id,
            source: currentHubData.hub.id,
            url: originalUrl,
            title: item.title,
            coverUrl: item.cover?.url,
            pinned: item.pinned,
        };
        togglePinStatus(itemParaApi);
    }, [currentHubData, togglePinStatus]);

    if (hubLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <Spinner text="Carregando hub..." />
            </div>
        );
    }
    if (hubError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <ErrorMessage 
                    message={hubError} 
                    onRetry={() => {
                        // AIDEV-NOTE: Force reload the page to trigger HubRouteHandler again
                        window.location.reload();
                    }} 
                />
            </div>
        );
    }
    if (!currentHubData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <Spinner text="Inicializando..." />
            </div>
        );
    }
    return (
        <div className="hub-view" data-connected={isConnected}>
            <div className="hub-container">
                <div className="hub-minimal-header">
                    <div className="hub-title-section">
                        {currentHubData.hub.icon && (
                            <img 
                                src={currentHubData.hub.icon.url}
                                alt={currentHubData.hub.icon.alt || currentHubData.hub.title}
                                width={128}
                                height={128}
                                style={{ borderRadius: '16px', objectFit: 'cover' }}
                            />
                        )}
                        <div className="hub-title-text">
                          <h1
                            className="hub-title"
                            style={{ fontSize: "2.5rem" }}
                          >
                            {currentHubData.hub.title}
                          </h1>
                          {currentHubData.hub.subtitle && (
                            <p
                              className="hub-subtitle"
                              style={{ fontSize: "1.5rem" }}
                            >
                              {currentHubData.hub.subtitle}
                            </p>
                          )}
                        </div>
                    </div>
                    {currentHubData.hub.description && (
                      <p
                        className="hub-description"
                        style={{ fontSize: "1.3rem" }}
                      >
                        {currentHubData.hub.description}
                      </p>
                    )}
                </div>
                <div className="hub-connection-status">
                    {showConnectedStatus && !isSyncing && (
                        <div className="status-card connected">
                            <div className="status-dot"></div>
                            <span className="status-text">✅ Conectado</span>
                            <button 
                                className="hub-btn"
                                onClick={handleSyncClick}
                                disabled={!canSync()}
                                title="Sincronizar dados"
                            >
                                🔄
                            </button>
                        </div>
                    )}
                    {!isConnected && showDisconnectedStatus && (
                        <div className="status-card disconnected">
                            <div className="status-dot"></div>
                            <span className="status-text">⚠️ Desconectado</span>
                            <button 
                                className="hub-btn"
                                onClick={() => setShowDisconnectedStatus(false)}
                                title="Fechar"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>
                <div className="hub-series-section">
                    <div className="hub-series-header">
                        <h2 className="hub-series-title">Séries Disponíveis</h2>
                        <div className="hub-series-count">
                            {filteredSeries.length} {filteredSeries.length === 1 ? 'série' : 'séries'}
                        </div>
                    </div>
                    <div className="hub-filters">
                        <input
                            type="text"
                            placeholder="Buscar séries..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="hub-search-box"
                        />
                    </div>
                    {filteredSeries.length > 0 ? (
                        <div className="hub-series-grid">
                            <ItemGrid
                                items={filteredSeries}
                                onSelectItem={handleSelectItem}
                                onPinToggle={handlePinToggle}
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
            </div>
        </div>
    );
};

export default HubView;
