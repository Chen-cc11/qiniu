import React from 'react';
import { MY_WORKS_ITEMS } from '../constants';
import GalleryCard from '../components/GalleryCard';

const MyWorksPage: React.FC = () => {
    return (
        <main className="flex-grow p-6 overflow-y-auto">
            <div className="container mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">我的作品</h1>
                {MY_WORKS_ITEMS.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {MY_WORKS_ITEMS.map(item => (
                            <GalleryCard key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                        </svg>
                        <p className="text-lg font-medium">您的作品库为空</p>
                        <p className="text-sm mt-1">快去创作您的第一个3D模型吧！</p>
                    </div>
                )}
            </div>
        </main>
    );
};

export default MyWorksPage;