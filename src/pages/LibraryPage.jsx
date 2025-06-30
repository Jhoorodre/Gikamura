import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import ItemGrid from '../components/item/ItemGrid';
import { BookOpenIcon } from '../components/common/Icones';

const LibraryPage = () => {
    const { 
        pinnedItems, 
        historyItems, 
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
        const encodedId = btoa(uniqueId);
        selectItem(item, item.sourceId);
        navigate(`/series/${encodedId}`);
    };

    return (
        <div className="fade-in">
            <div className="flex items-center gap-4 mb-12">
                <BookOpenIcon />
                <h1 className="text-4xl orbitron">Minha Biblioteca</h1>
            </div>
            <div>
                <h2 className="text-2xl font-semibold mb-6">Fixados</h2>
                {pinnedItems.length > 0 ? (
                    <ItemGrid
                        items={pinnedItems}
                        onSelectItem={handleSelectItem}
                        onPinToggle={togglePinStatus}
                    />
                ) : (
                    <p className="text-slate-400">Você ainda não fixou nenhuma série. Clique na estrela (☆) em uma série para adicioná-la aqui.</p>
                )}
            </div>
            <div className="mt-16">
                <h2 className="text-2xl font-semibold mb-6">Histórico de Leitura</h2>
                {historyItems.length > 0 ? (
                    <ItemGrid
                        items={historyItems}
                        onSelectItem={handleSelectItem}
                        onPinToggle={togglePinStatus}
                    />
                ) : (
                    <p className="text-slate-400">Seu histórico de leitura está vazio. Comece a ler para ver as séries aqui.</p>
                )}
            </div>
        </div>
    );
};

export default LibraryPage;
