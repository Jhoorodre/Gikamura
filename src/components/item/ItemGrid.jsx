import React from 'react';
import { BookOpenIcon } from '../common/Icones';
import Image from '../common/Image';

const ItemGrid = ({ items, onSelectItem }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {items.map((item, index) => (
            <div key={item.id} onClick={() => onSelectItem(item)} className="manga-card panel-solid rounded-2xl overflow-hidden cursor-pointer group fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="relative aspect-[3/4] overflow-hidden">
                    <Image 
                        src={item.cover.url} 
                        alt={item.cover.alt} 
                        className="w-full h-full object-cover" 
                        errorSrc='https://placehold.co/400x600/1f2937/4b5563?text=Capa'
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-4"><BookOpenIcon /></div>
                    </div>
                </div>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-red-400 group-hover:to-red-600 group-hover:bg-clip-text transition-all duration-300">{item.title}</h3>
                    <div className="h-1 bg-gradient-to-r from-red-800 to-red-600 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </div>
            </div>
        ))}
    </div>
);

export default ItemGrid;
