import React from 'react';
import { INSPIRATION_ITEMS } from '../constants';
import GalleryCard from '../components/GalleryCard';

const InspirationPage: React.FC = () => {
    return (
        <main className="flex-grow p-6 overflow-y-auto">
            <div className="container mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">灵感库</h1>
                 {INSPIRATION_ITEMS.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {INSPIRATION_ITEMS.map(item => (
                            <GalleryCard key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M12 14.5v5.25a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 19.5V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        <p className="text-lg font-medium">灵感库当前为空</p>
                        <p className="text-sm mt-1">我们会尽快添加新的灵感模型。</p>
                    </div>
                )}
            </div>
        </main>
    );
};

export default InspirationPage;