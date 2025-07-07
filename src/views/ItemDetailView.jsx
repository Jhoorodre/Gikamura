import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import ItemInfo from '../components/item/ItemInfo';
import EntryList from '../components/item/EntryList';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';
import { ChevronLeftIcon, BookOpenIcon } from '../components/common/Icones';
import { decodeUrl, encodeUrl } from '../utils/encoding';

const ItemDetailView = () => {
    const { encodedId } = useParams();
    const navigate = useNavigate();
    const { 
        currentHubData, 
        selectedItemData, 
        selectItem, 
        clearSelectedItem, 
        itemLoading, 
        itemError,
        togglePinStatus,
        refetchItem
    } = useAppContext();

    const [sortOrder, setSortOrder] = useState('asc');

    // Decodifica e extrai informações do ID
    const decodedInfo = useMemo(() => {
        if (!encodedId) return null;
        try {
            const decodedId = decodeUrl(encodedId);
            const [hubId, slug] = decodedId.split(':');
            return { hubId, slug, decodedId };
        } catch (error) {
            console.error('❌ Erro ao decodificar ID:', error);
            return null;
        }
    }, [encodedId]);

    // Encontra o item no hub atual
    const itemFromHub = useMemo(() => {
        if (!currentHubData?.series || !decodedInfo?.slug) return null;
        return currentHubData.series.find(i => i.slug === decodedInfo.slug);
    }, [currentHubData?.series, decodedInfo?.slug]);

    // Handlers otimizados com useCallback
    const handleGoBack = useCallback(() => {
        clearSelectedItem();
        navigate('/');
    }, [clearSelectedItem, navigate]);

    const handleSelectEntry = useCallback((entryKey) => {
        navigate(`/read/${encodedId}/${encodeUrl(entryKey)}`);
    }, [navigate, encodedId]);

    const handlePinToggle = useCallback(() => {
        if (selectedItemData) {
            togglePinStatus(selectedItemData);
        }
    }, [selectedItemData, togglePinStatus]);

    const handleRetry = useCallback(() => {
        if (refetchItem) {
            refetchItem();
        } else if (itemFromHub && decodedInfo?.hubId) {
            selectItem(itemFromHub, decodedInfo.hubId);
        }
    }, [refetchItem, itemFromHub, decodedInfo?.hubId, selectItem]);

    // Carrega o item quando necessário
    useEffect(() => {
        if (!currentHubData || !itemFromHub || !decodedInfo) return;
        
        if (!selectedItemData || selectedItemData.slug !== decodedInfo.slug) {
            selectItem(itemFromHub, decodedInfo.hubId);
        }
    }, [currentHubData, itemFromHub, decodedInfo, selectedItemData, selectItem]);

    // Estados de loading e erro melhorados
    if (itemLoading || !selectedItemData) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
                <div className="text-center max-w-md w-full">
                    <div className="mb-6">
                        <Spinner size="lg" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                        Carregando série...
                    </h2>
                    <p className="text-gray-400 text-sm sm:text-base">
                        Aguarde enquanto buscamos as informações da obra
                    </p>
                </div>
            </div>
        );
    }
    
    if (itemError) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
                <div className="max-w-md w-full">
                    <ErrorMessage 
                        message={`Erro ao carregar série: ${itemError}`}
                        onRetry={handleRetry}
                    />
                    <div className="mt-6 text-center">
                        <Button
                            onClick={handleGoBack}
                            variant="outline"
                            className="text-white hover:bg-gray-800 border-gray-600 hover:border-gray-500"
                        >
                            <ChevronLeftIcon className="w-4 h-4 mr-2" />
                            Voltar
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Validação adicional
    if (!selectedItemData) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
                <div className="text-center text-gray-400">
                    <BookOpenIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-xl mb-2">Série não encontrada</p>
                    <p className="text-sm mb-6">Não foi possível encontrar os dados desta obra.</p>
                    <Button
                        onClick={handleGoBack}
                        variant="outline"
                        className="text-white hover:bg-gray-800 border-gray-600 hover:border-gray-500"
                    >
                        <ChevronLeftIcon className="w-4 h-4 mr-2" />
                        Voltar
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header de navegação melhorado */}
            <div className="border-b border-gray-800 sticky top-0 z-20 bg-gray-900/95 backdrop-blur-sm">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Button 
                            onClick={handleGoBack} 
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white px-2 py-1"
                            aria-label="Voltar para a lista"
                        >
                            <ChevronLeftIcon className="w-4 h-4 mr-1" />
                            Hub
                        </Button>
                        <Button
                            onClick={() => alert('DEBUG: Cliquei no botão SÉRIE')}
                            variant="outline"
                            size="sm"
                            className="bg-red-600 text-white px-3 py-2 flex items-center gap-2"
                            aria-label="DEBUG SÉRIE"
                            title="DEBUG SÉRIE"
                        >
                            <BookOpenIcon className="w-4 h-4" />
                            <span className="text-sm">SÉRIE DEBUG</span>
                        </Button>
                        <span style={{color: 'yellow', fontWeight: 'bold'}}>DEBUG HEADER ATIVO</span>
                        <div className="flex-1">
                            <span className="text-white font-bold text-lg">{selectedItemData.title}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Conteúdo principal */}
            <div className="container mx-auto px-6 py-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Informações da série */}
                    <ItemInfo
                        itemData={selectedItemData}
                        pinned={selectedItemData.pinned}
                        onPinToggle={handlePinToggle}
                    />

                    {/* Lista de capítulos */}
                    {selectedItemData.entries && (
                        <div className="bg-gray-800/30 rounded-lg border border-gray-700 p-6">
                            <EntryList
                                itemData={selectedItemData}
                                onSelectEntry={handleSelectEntry}
                                readChapters={selectedItemData.readChapterKeys}
                                sortOrder={sortOrder}
                                setSortOrder={setSortOrder}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ItemDetailView;
