import React from 'react';
import { GalleryItem } from '../types';

const GalleryCard: React.FC<{ item: GalleryItem }> = ({ item }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden relative cursor-pointer group">
            <img src={item.imageUrl} alt={item.title} className="w-full h-32 object-cover" />
            <div className="p-3">
                <h4 className="font-semibold text-sm truncate">{item.title}</h4>
                <div className="text-xs text-gray-400 mt-1 flex justify-between">
                    <span>{item.time}</span>
                    <span>{item.details}</span>
                </div>
            </div>
            {item.selected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white border-2 border-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </div>
            )}
            {item.badge && (
                <div className="absolute top-24 left-2 bg-black/50 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                    {item.badge}
                </div>
            )}
        </div>
    );
};

export default GalleryCard;
