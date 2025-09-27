import React from 'react';
import type { ModelParameters } from '../types';
import { FaceLimitPreset, TextureQuality, ModelStyle, GenerationMode, TextureAlignment } from '../types';
import CustomSelect from './CustomSelect';
import Tooltip from './Tooltip';
import { RefreshIcon } from './icons';

const Section: React.FC<{ title: string; tooltip?: string; children: React.ReactNode }> = ({ title, tooltip, children }) => (
    <div className="mb-5">
        <div className="flex items-center mb-2">
            <h3 className="text-sm font-semibold text-gray-600 mr-1.5">{title}</h3>
            {tooltip && <Tooltip text={tooltip} />}
        </div>
        {children}
    </div>
);

const faceLimitOptions = {
    [FaceLimitPreset.LOW]: 10000,
    [FaceLimitPreset.MEDIUM]: 50000,
    [FaceLimitPreset.HIGH]: 100000,
};

const textureQualityOptions = {
    [TextureQuality.STANDARD]: 'standard',
    [TextureQuality.DETAILED]: 'detailed',
} as const;

// 新增：为图生3D模式添加纹理对齐选项
const textureAlignmentOptions = {
    [TextureAlignment.ORIGINAL]: 'original_image',
    [TextureAlignment.AUTO]: 'ai_generated',
} as const;

// 修复：使用 'as const' 来确保TypeScript推断出选项值的窄字面量类型。
const styleOptions = {
    [ModelStyle.NONE]: '',
    [ModelStyle.CLAY]: 'object:clay',
    [ModelStyle.GOLD]: 'gold',
    [ModelStyle.ANCIENT_BRONZE]: 'ancient_bronze',
    [ModelStyle.STEAMPUNK]: 'object:steampunk',
} as const;

// 辅助函数：根据值查找键
const getKeyByValue = (object: { [key: string]: any }, value: any) => {
    return Object.keys(object).find(key => object[key] === value);
};

const ParamsPanel: React.FC<{
  parameters: ModelParameters;
  onParametersChange: React.Dispatch<React.SetStateAction<ModelParameters>>;
  // 新增：接收当前生成模式，用于动态显示UI
  mode: GenerationMode;
}> = ({ parameters, onParametersChange, mode }) => {

    const handleParamChange = <K extends keyof ModelParameters>(param: K, value: ModelParameters[K]) => {
        onParametersChange(prev => ({ ...prev, [param]: value }));
    };

    const handleRandomizeSeed = () => {
        handleParamChange('modelSeed', Math.floor(Math.random() * 90000000) + 10000000);
    };
    
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm h-full">
            <h2 className="text-lg font-bold mb-6 text-gray-800">高级参数</h2>
            
            {/* 条件渲染：反向提示词仅在文生3D模式下显示 */}
            {mode === GenerationMode.TEXT_TO_3D && (
                <Section title="反向提示词" tooltip="描述您不希望在模型中看到的内容，例如模糊、丑陋的细节。">
                    <textarea
                        value={parameters.negativePrompt}
                        onChange={(e) => handleParamChange('negativePrompt', e.target.value)}
                        placeholder="例如: 模糊, 丑陋, 变形"
                        className="w-full h-20 p-2 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition bg-gray-50 text-sm"
                    />
                </Section>
            )}


            <Section title="模型精细度" tooltip="定义模型的多边形数量。数量越高，细节越丰富，但生成时间可能更长。">
                <CustomSelect
                    value={getKeyByValue(faceLimitOptions, parameters.faceLimit) || FaceLimitPreset.MEDIUM}
                    options={Object.values(FaceLimitPreset)}
                    onChange={(val) => handleParamChange('faceLimit', faceLimitOptions[val as FaceLimitPreset])}
                />
            </Section>

            <Section title="生成纹理">
                <div className="flex space-x-2">
                    <button 
                        onClick={() => handleParamChange('texture', true)}
                        className={`flex-1 py-2 text-sm rounded-lg transition-colors border ${parameters.texture ? 'bg-blue-500 text-white border-blue-500 font-semibold' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                        启用
                    </button>
                    <button
                        onClick={() => handleParamChange('texture', false)} 
                        className={`flex-1 py-2 text-sm rounded-lg transition-colors border ${!parameters.texture ? 'bg-blue-500 text-white border-blue-500 font-semibold' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                        禁用
                    </button>
                </div>
            </Section>
            
            <Section title="纹理质量">
                <CustomSelect
                    value={getKeyByValue(textureQualityOptions, parameters.textureQuality) || TextureQuality.STANDARD}
                    options={Object.values(TextureQuality)}
                    onChange={(val) => handleParamChange('textureQuality', textureQualityOptions[val as TextureQuality])}
                />
            </Section>
            
            {/* 条件渲染：纹理对齐仅在图生3D模式下显示 */}
            {mode === GenerationMode.IMAGE_TO_3D && (
                <Section title="纹理对齐" tooltip="选择纹理如何贴合到模型上。'原始图像'会严格按照原图进行投射，'AI生成'则会由AI优化贴图方式。">
                    <CustomSelect
                        value={getKeyByValue(textureAlignmentOptions, parameters.textureAlignment) || TextureAlignment.ORIGINAL}
                        options={Object.values(TextureAlignment)}
                        onChange={(val) => handleParamChange('textureAlignment', textureAlignmentOptions[val as TextureAlignment])}
                    />
                </Section>
            )}

            <Section title="模型风格">
                <CustomSelect
                    value={getKeyByValue(styleOptions, parameters.style) || ModelStyle.NONE}
                    options={Object.values(ModelStyle)}
                    onChange={(val) => handleParamChange('style', styleOptions[val as ModelStyle])}
                />
            </Section>

            <Section title="专业四边面" tooltip="启用后，模型将由四边形构成，更适合专业编辑和动画制作。">
                <div className="flex space-x-2">
                    <button 
                        onClick={() => handleParamChange('quad', true)}
                        className={`flex-1 py-2 text-sm rounded-lg transition-colors border ${parameters.quad ? 'bg-blue-500 text-white border-blue-500 font-semibold' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                        启用
                    </button>
                    <button
                        onClick={() => handleParamChange('quad', false)} 
                        className={`flex-1 py-2 text-sm rounded-lg transition-colors border ${!parameters.quad ? 'bg-blue-500 text-white border-blue-500 font-semibold' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                        禁用
                    </button>
                </div>
            </Section>

            <Section title="模型种子" tooltip="一个数字，用于生成可复现的模型。相同的种子和提示词会产生相似的结果。留空则随机。">
                 <div className="flex items-center space-x-2">
                    <input
                        type="number"
                        value={parameters.modelSeed ?? ''}
                        onChange={(e) => handleParamChange('modelSeed', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                        placeholder="留空以随机生成"
                        className="flex-grow w-full bg-gray-100 px-4 py-2.5 rounded-lg text-sm text-left focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                    />
                    <button
                        onClick={handleRandomizeSeed}
                        className="p-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0"
                        aria-label="生成随机种子"
                    >
                        <RefreshIcon className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </Section>
        </div>
    );
};

export default ParamsPanel;