import React from 'react';
import { ModelParameters } from '../types';

const ParameterSection: React.FC<{ title: string; children: React.ReactNode; info?: string; }> = ({ title, children, info }) => (
    <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-gray-700">{title}</label>
            {info && <span className="text-xs text-gray-400">{info}</span>}
        </div>
        {children}
    </div>
);

interface LeftSidebarProps {
    params: ModelParameters;
    setParams: React.Dispatch<React.SetStateAction<ModelParameters>>;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ params, setParams }) => {

    const handleParamChange = <K extends keyof ModelParameters>(key: K, value: ModelParameters[K]) => {
        setParams(prevParams => ({ ...prevParams, [key]: value }));
    };

    return (
        <aside className="w-[320px] bg-white p-6 rounded-2xl shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold">模型参数</h2>
                <button className="text-gray-400 hover:text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>
            
            <div className="flex-grow">
                <ParameterSection title="精细度" info={`${Math.round(5000 + (params.precision / 100) * 95000)} faces`}>
                    <div className="relative">
                        <div className="flex justify-between text-sm text-gray-500 mb-2">
                            <span>低</span>
                            <span>高</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={params.precision}
                            onChange={(e) => handleParamChange('precision', Number(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </ParameterSection>

                <ParameterSection title="纹理质量">
                     <select
                        value={params.textureQuality}
                        onChange={(e) => handleParamChange('textureQuality', e.target.value as 'standard' | 'detailed')}
                        className="w-full text-left bg-gray-50 border border-gray-200 rounded-md px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
                    >
                        <option value="standard">标准 (Standard)</option>
                        <option value="detailed">精细 (Detailed)</option>
                    </select>
                </ParameterSection>

                <ParameterSection title="材质预设">
                    <div className="flex space-x-3">
                        <button onClick={() => handleParamChange('material', 'glossy')} aria-label="光泽材质" className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 ${params.material === 'glossy' ? 'border-orange-500' : 'border-transparent'}`}>
                            <div className="w-8 h-8 rounded-full bg-orange-400"></div>
                        </button>
                        <button onClick={() => handleParamChange('material', 'texture')} aria-label="纹理材质" className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 ${params.material === 'texture' ? 'border-orange-500' : 'border-transparent'}`}>
                            <div className="w-8 h-8 rounded-md bg-gray-500 bg-[linear-gradient(45deg,#4a5568_25%,transparent_25%,transparent_75%,#4a5568_75%,#4a5568),linear-gradient(45deg,#4a5568_25%,transparent_25%,transparent_75%,#4a5568_75%,#4a5568)] bg-cover" style={{ backgroundSize: '10px 10px', backgroundPosition: '0 0, 5px 5px'}}></div>
                        </button>
                        <button onClick={() => handleParamChange('material', 'liquid')} aria-label="液体材质" className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 ${params.material === 'liquid' ? 'border-orange-500' : 'border-transparent'}`}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.626 8.354C6.347 8.075 6 7.568 6 7a2 2 0 014 0c0 .568-.347 1.075-.626 1.354a4.985 4.985 0 01-2.748 0z" clipRule="evenodd" /></svg>
                            </div>
                        </button>
                    </div>
                </ParameterSection>

                <ParameterSection title="光源设置">
                    <div className="flex space-x-3">
                        <button onClick={() => handleParamChange('lightSource', 'soft')} className={`px-6 py-2 rounded-md text-sm font-medium ${params.lightSource === 'soft' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                            柔和
                        </button>
                        <button onClick={() => handleParamChange('lightSource', 'custom')} aria-label="自定义光源" className={`px-6 py-2 rounded-md ${params.lightSource === 'custom' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                            <div className="w-16 h-4 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full"></div>
                        </button>
                    </div>
                </ParameterSection>

                <ParameterSection title="输出格式">
                    <div className="flex space-x-6 text-sm font-medium text-gray-400">
                        <button onClick={() => handleParamChange('outputFormat', 'OBJ')} className={`${params.outputFormat === 'OBJ' && 'text-gray-800 font-bold'}`}>OBJ</button>
                        <button onClick={() => handleParamChange('outputFormat', 'GLB')} className={`${params.outputFormat === 'GLB' && 'text-gray-800 font-bold'}`}>GLB</button>
                        <button onClick={() => handleParamChange('outputFormat', 'STL')} className={`${params.outputFormat === 'STL' && 'text-gray-800 font-bold'}`}>STL</button>
                    </div>
                </ParameterSection>
            </div>
            
            <button className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm4 4a1 1 0 100 2h4a1 1 0 100-2H8zm0 4a1 1 0 100 2h4a1 1 0 100-2H8z" clipRule="evenodd" /></svg>
                <span>保存预设</span>
            </button>
        </aside>
    );
};

export default LeftSidebar;
