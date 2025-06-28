import React, { useMemo } from 'react';

const ChapterList = ({ mangaData, onSelectChapter, sortOrder, setSortOrder }) => {
    const chapterKeys = useMemo(() => {
        if (!mangaData?.chapters) return [];
        const keys = Object.keys(mangaData.chapters);
        return keys.sort((a, b) => {
            const numA = parseFloat(a.match(/(\d+(\.\d+)?)/)?.[0]) || 0;
            const numB = parseFloat(b.match(/(\d+(\.\d+)?)/)?.[0]) || 0;
            if (numA !== numB) {
                return sortOrder === 'asc' ? numA - numB : numB - numA;
            }
            return sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
        });
    }, [mangaData, sortOrder]);

    return (
        <div className="panel">
            <div className="panel-header flex justify-between items-center">
                <h2 className="orbitron text-2xl">Capítulos</h2>
                <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="btn btn-ghost btn-sm">
                    Ordenar {sortOrder === 'asc' ? 'Decrescente' : 'Crescente'}
                </button>
            </div>
            <div className="panel-body flex flex-col gap-2">
                {chapterKeys.map((key) => {
                    const chapter = mangaData.chapters[key];
                    return (
                        <button 
                            key={key} 
                            onClick={() => onSelectChapter(key)}
                            className="entry-item"
                        >
                            <span className="entry-item-title">Cap. {key}: {chapter.title}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ChapterList;
