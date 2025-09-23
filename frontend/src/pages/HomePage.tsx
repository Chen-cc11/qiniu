import React, { useState } from 'react';
import LeftSidebar from '../components/LeftSidebar';
import MainContent from '../components/MainContent';
import RightSidebar from '../components/RightSidebar';
import { ModelParameters } from '../../types';

const HomePage: React.FC = () => {
  const [params] = useState<ModelParameters>({
    precision: 50,
    textureQuality: 'standard',
    material: 'glossy',
    lightSource: 'soft',
    outputFormat: 'GLB',
  });

  

  return (
    <main className="flex flex-grow p-6 gap-6 overflow-hidden">
      <LeftSidebar />
      <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
          <MainContent params={params} onGenerationComplete={() => {}} />
      </div>
      <RightSidebar />
    </main>
  );
};

export default HomePage;
