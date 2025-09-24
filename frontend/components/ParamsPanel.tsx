import React from 'react';
import type { ModelParameters } from '../types';
import { ModelFineness, TextureQuality, MaterialType, LightSource, OutputFormat } from '../types';
import CustomSelect from './CustomSelect';
import { PlusIcon } from './icons';

interface ParamsPanelProps {
  parameters: ModelParameters;
  onParametersChange: React.Dispatch<React.SetStateAction<ModelParameters>>;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-5">
        <h3 className="text-sm font-semibold text-gray-600 mb-2">{title}</h3>
        {children}
    </div>
);


const ParamsPanel: React.FC<ParamsPanelProps> = ({ parameters, onParametersChange }) => {

    const handleParamChange = <K extends keyof ModelParameters,>(param: K, value: ModelParameters[K]) => {
        onParametersChange(prev => ({ ...prev, [param]: value }));
    };

    const handleColorSelect = (color: string) => {
        // FIX: Cannot find name 'onParametersactionsChange'. Did you mean 'onParametersChange'?
        // FIX: Corrected typo from onParametersactionsChange to onParametersChange.
        onParametersChange(prev => ({ ...prev, selectedColor: color }));
    };
    
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm h-full">
      <h2 className="text-lg font-bold mb-6 text-gray-800">模型参数</h2>
      
      <Section title="模型精细度">
          <CustomSelect
              value={parameters.fineness}
              options={Object.values(ModelFineness)}
              onChange={(val) => handleParamChange('fineness', val as ModelFineness)}
          />
      </Section>
      
      <Section title="纹理质量">
          <CustomSelect
              value={parameters.textureQuality}
              options={Object.values(TextureQuality)}
              onChange={(val) => handleParamChange('textureQuality', val as TextureQuality)}
          />
      </Section>

      <Section title="材质类型">
          <CustomSelect
              value={parameters.materialType}
              options={Object.values(MaterialType)}
              onChange={(val) => handleParamChange('materialType', val as MaterialType)}
          />
      </Section>

      <Section title="颜色方案">
          <div className="grid grid-cols-4 gap-2">
              {parameters.colors.map(color => (
                  <button 
                      key={color}
                      onClick={() => handleParamChange('selectedColor', color)}
                      className={`w-full h-10 rounded-md border-2 transition-transform duration-150 ${parameters.selectedColor === color ? 'border-blue-500 scale-110 ring-2 ring-blue-300' : 'border-gray-200'}`}
                      style={{ backgroundColor: color }}
                      aria-label={`Color ${color}`}
                  />
              ))}
              <button className="w-full h-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200" aria-label="Add new color">
                  <PlusIcon className="w-5 h-5"/>
              </button>
          </div>
      </Section>

      <Section title="光源">
        <div className="flex space-x-2">
            <button 
                onClick={() => handleParamChange('lightSource', LightSource.SOFT)}
                className={`flex-1 py-2 text-sm rounded-lg transition-colors border ${parameters.lightSource === LightSource.SOFT ? 'bg-blue-500 text-white border-blue-500 font-semibold' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                {LightSource.SOFT}
            </button>
            <button
                onClick={() => handleParamChange('lightSource', LightSource.STRONG)} 
                className={`flex-1 py-2 text-sm rounded-lg transition-colors border ${parameters.lightSource === LightSource.STRONG ? 'bg-blue-500 text-white border-blue-500 font-semibold' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                {LightSource.STRONG}
            </button>
        </div>
      </Section>

      <Section title="输出格式">
        <CustomSelect
            value={parameters.outputFormat}
            options={Object.values(OutputFormat)}
            onChange={(val) => handleParamChange('outputFormat', val as OutputFormat)}
        />
      </Section>

      <button className="w-full py-2.5 mt-2 text-sm font-semibold text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
          保存预设
      </button>

    </div>
  );
};

export default ParamsPanel;