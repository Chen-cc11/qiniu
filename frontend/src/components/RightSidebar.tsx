import React from 'react';
import GalleryCard from './GalleryCard';
import { GalleryItem } from '../types';

interface RightSidebarProps {
    historyItems: GalleryItem[];
}

const RightSidebar: React.FC<RightSidebarProps> = ({ historyItems }) => {
    return (
        <aside className="w-[320px] flex flex-col space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm flex-grow">
                <h3 className="text-lg font-bold mb-4">生成历史</h3>
                {historyItems.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                        {historyItems.map(item => (
                            <GalleryCard key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium">暂无生成历史</p>
                    </div>
                )}
            </div>
            <div className="text-center">
                <a href="#/my-works" className="text-sm font-medium text-gray-500 hover:text-gray-800">
                    查看全部生成记录 &rsaquo;
                </a>
            </div>
        </aside>
    );
};

export default RightSidebar;
