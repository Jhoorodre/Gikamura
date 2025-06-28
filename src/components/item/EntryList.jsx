import React, { useMemo } from 'react';
import { SortAscendingIcon, SortDescendingIcon } from '../common/Icones';

const ChapterList = ({ mangaData, onSelectChapter, sortOrder, setSortOrder }) => {
    const chapterKeys = useMemo(() => {
        if (!mangaData?.chapters) return [];
        const keys = Object.keys(mangaData.chapters);
        return keys.sort((a, b) => {
            const numA = parseFloat(a.replace(/[^0-9.]/g, '')) || 0;
            const numB = parseFloat(b.replace(/[^0-9.]/g, '')) || 0;
            return sortOrder === 'asc' ? numA - numB : numB - numA;
        });
    }, [mangaData, sortOrder]);

    return (
        <div className="panel-solid rounded-3xl p-8 fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white orbitron">Capítulos</h2>
                <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="panel-dark px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-all flex items-center gap-2">
                    {sortOrder === 'asc' ? <SortAscendingIcon/> : <SortDescendingIcon />}
                    <span>{sortOrder === 'asc' ? 'Mais Antigos' : 'Mais Recentes'}</span>
                </button>
            </div>
            <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-2">
                {chapterKeys.map((key, index) => {
                    const chapter = mangaData.chapters[key];
                    return (
                        <div key={key} className="chapter-item" style={{ animationDelay: `${index * 0.05}s` }}>
                            <button onClick={() => onSelectChapter(key)} className={`w-full text-left p-4 rounded-xl transition-all duration-300 text-white panel-dark hover:bg-white/10 hover:transform hover:scale-102`}>
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Cap. {key}: {chapter.title}</span>
                                </div>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ChapterList;
