import { useMemo } from 'react';

const EntryList = ({ itemData, onSelectEntry, sortOrder, setSortOrder, readChapters = [], isOnline }) => {
    const entryKeys = useMemo(() => {
        if (!itemData?.entries) return [];
        const keys = Object.keys(itemData.entries);
        return keys.sort((a, b) => {
            const numA = parseFloat(a.match(/(\d+(\.\d+)?)/)?.[0]) || 0;
            const numB = parseFloat(b.match(/(\d+(\.\d+)?)/)?.[0]) || 0;
            if (numA !== numB) {
                return sortOrder === 'asc' ? numA - numB : numB - numA;
            }
            return sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
        });
    }, [itemData, sortOrder]);

    return (
        <div className="panel">
            <div className="panel-header flex justify-between items-center">
                <h2 className="orbitron text-2xl">Capítulos</h2>
                <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="btn btn-ghost btn-sm">
                    Ordenar {sortOrder === 'asc' ? 'Decrescente' : 'Crescente'}
                </button>
            </div>
            <div className="panel-body flex flex-col gap-2">
                {entryKeys.map((key) => {
                    const entry = itemData.entries[key];
                    const isRead = readChapters.includes(key);
                    // A verificação agora usa a propriedade 'online' do remoteStorage
                    const isPending = isRead && !isOnline;
                    return (
                        <button
                            key={key}
                            onClick={() => onSelectEntry(key)}
                            className={`entry-item ${isRead ? 'read' : ''}`}
                        >
                            <span className="entry-item-title">Cap. {key}: {entry?.title}</span>
                            {isPending && <span className="text-xs text-yellow-400 ml-2">(Pendente)</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default EntryList;
