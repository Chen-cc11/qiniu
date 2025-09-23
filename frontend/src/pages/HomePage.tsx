import React, { useState, useCallback } from 'react';
import LeftSidebar from '../components/LeftSidebar';
import MainContent from '../components/MainContent';
import RightSidebar from '../components/RightSidebar';
import { ModelParameters, GalleryItem } from '../types';

const HomePage: React.FC = () => {
  const [params, setParams] = useState<ModelParameters>({
    precision: 50,
    textureQuality: 'standard',
    material: 'glossy',
    lightSource: 'soft',
    outputFormat: 'GLB',
  });

  const [historyItems, setHistoryItems] = useState<GalleryItem[]>([]);

  const handleGenerationComplete = useCallback((item: GalleryItem) => {
    setHistoryItems(prev => [item, ...prev]);
  }, []);

  return (
    <main className="flex flex-grow p-6 gap-6 overflow-hidden">
      <LeftSidebar params={params} setParams={setParams} />
      <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
          <MainContent params={params} onGenerationComplete={handleGenerationComplete} />
      </div>
      <RightSidebar historyItems={historyItems} />
    </main>
  );
};

export default HomePage;
