import React, { useRef, useEffect } from 'react';
import type { TaskStatus, Model } from '../types';
import { GenerationMode } from '../types';
import { WandIcon, TimeIcon, AiIcon, ImageIcon, XIcon, ChevronLeftIcon, ChevronRightIcon, XCircleIcon } from './icons';

interface GenerationPanelProps {
  mode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  imageFile: File | null;
  onImageFileChange: (file: File | null) => void;
  onGenerate: () => void;
  taskStatus: TaskStatus;
  inspirationModels: Model[];
  onInspirationSelect: (model: Model) => void;
}

const GenerationPanel: React.FC<GenerationPanelProps> = ({ mode, onModeChange, prompt, onPromptChange, imageFile, onImageFileChange, onGenerate, taskStatus, inspirationModels, onInspirationSelect }) => {
    
  const isProcessing = taskStatus.status === 'processing';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'recommended' | 'history'>('recommended');
  const isLoggedIn = false; // 模拟数据：在真实应用中，这将来自认证上下文（auth context）。

  useEffect(() => {
    let url: string | null = null;
    if (imageFile) {
      url = URL.createObjectURL(imageFile);
      setImagePreviewUrl(url);
    } else {
      setImagePreviewUrl(null);
    }
    // 在组件卸载或文件更改时，清理URL对象
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [imageFile]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    onImageFileChange(file || null);
  };

  const handleImageRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageFileChange(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };


  return (
    <div className="flex flex-col h-full">
        {/* === 主要生成控制区域 === */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <h2 className="text-lg font-bold text-gray-800">模型生成</h2>
              {taskStatus.status === 'completed' && (
                <div className="flex items-center space-x-1.5 bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full animate-fade-in">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>模型准备就绪</span>
                </div>
              )}
            </div>
            <div className="flex border border-gray-200 rounded-lg p-1 bg-gray-50 mb-4">
                <button 
                    onClick={() => onModeChange(GenerationMode.TEXT_TO_3D)}
                    className={`flex-1 py-2 text-sm rounded-md transition-all duration-300 ${mode === GenerationMode.TEXT_TO_3D ? 'bg-white shadow text-blue-600 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                    文生3D
                </button>
                <button 
                    onClick={() => onModeChange(GenerationMode.IMAGE_TO_3D)}
                    className={`flex-1 py-2 text-sm rounded-md transition-all duration-300 ${mode === GenerationMode.IMAGE_TO_3D ? 'bg-white shadow text-blue-600 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}>
                    图生3D
                </button>
            </div>

            {mode === GenerationMode.TEXT_TO_3D ? (
                <>
                    <label htmlFor="prompt" className="text-sm font-semibold text-gray-600 mb-2 block">输入模型描述</label>
                    <div className="relative">
                        <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => onPromptChange(e.target.value)}
                            maxLength={150}
                            placeholder="请输⼊想要⽣成的内容，建议以单体为主，例如⼀只棕⾊的熊"
                            className="w-full h-36 p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition bg-gray-50"
                            disabled={isProcessing}
                        />
                        <span className="absolute bottom-3 right-3 text-xs text-gray-400">{prompt.length}/150</span>
                    </div>
                </>
            ) : (
                <>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">上传图片</label>
                    <div className="w-full h-36">
                        {imagePreviewUrl ? (
                            <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-dashed border-gray-300 group">
                                <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                                <button 
                                    onClick={handleImageRemove} 
                                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-black/75 transition-all"
                                    aria-label="Remove image"
                                >
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-blue-400 cursor-pointer transition-colors"
                            >
                                <ImageIcon className="w-8 h-8 mb-2 text-gray-400" />
                                <span className="text-sm">点击或拖拽图片上传</span>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept="image/png, image/jpeg"
                                    className="hidden"
                                    disabled={isProcessing}
                                />
                            </div>
                        )}
                    </div>
                </>
            )}

            <button
                onClick={onGenerate}
                disabled={isProcessing || (mode === GenerationMode.TEXT_TO_3D && prompt.trim() === '') || (mode === GenerationMode.IMAGE_TO_3D && !imageFile)}
                className="w-full mt-4 py-3 text-base font-semibold text-white bg-blue-500 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-600 transition-all duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
            >
                <WandIcon className="w-5 h-5" />
                <span>生成模型</span>
            </button>
            
            {/* === 错误提示 === */}
            {taskStatus.status === 'failed' && (
                <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 animate-fade-in" role="alert">
                    <div className="flex">
                        <div className="py-1"><XCircleIcon className="h-6 w-6 text-red-500 mr-3" /></div>
                        <div>
                            <p className="font-bold">生成失败</p>
                            <p className="text-sm">{taskStatus.error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* === 提示信息 (无错误且不在处理中时显示) === */}
            {taskStatus.status !== 'processing' && taskStatus.status !== 'failed' && (
              <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <strong>提示:</strong> {mode === GenerationMode.TEXT_TO_3D 
                      ? '尽可能提供详细的材质、尺寸和风格描述。例如: "一个30cm高的陶瓷花瓶, 哑光表面, 带几何图案"'
                      : '请上传清晰、主体突出的图片以获得最佳效果。'}
              </div>
            )}
        </div>
        
        {/* === 条件渲染的底部面板（进度或灵感） === */}
        <div className="flex-grow mt-6 flex flex-col">
          {isProcessing ? (
              <div className="bg-white p-6 rounded-xl shadow-sm animate-fade-in h-full">
                  <h2 className="text-lg font-bold mb-4 text-gray-800">生成进度</h2>
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">进度</span>
                      <span className="text-sm font-semibold text-blue-500">{taskStatus.progress?.toFixed(0) ?? 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${taskStatus.progress ?? 0}%` }}></div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                          <TimeIcon className="w-5 h-5"/>
                          <span>预计剩余时间: {taskStatus.eta ? `${taskStatus.eta}秒` : '计算中...'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                          <AiIcon className="w-5 h-5"/>
                          <span>{taskStatus.message || 'AI正在处理您的模型细节...'}</span>
                      </div>
                  </div>
              </div>
          ) : (
                <div className="bg-white p-4 rounded-xl shadow-sm animate-fade-in h-full flex flex-col">
                    <div className="flex-shrink-0">
                        <div className="p-1 mb-3 bg-gray-100 rounded-lg flex max-w-[200px] mx-auto border border-gray-200">
                            <button onClick={() => setActiveTab('recommended')} className={`w-1/2 rounded-md py-1 text-sm font-medium transition-colors duration-200 ${activeTab === 'recommended' ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:bg-gray-200'}`}>推荐</button>
                            <button onClick={() => setActiveTab('history')} className={`w-1/2 rounded-md py-1 text-sm font-medium transition-colors duration-200 ${activeTab === 'history' ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:bg-gray-200'}`}>历史记录</button>
                        </div>
                    </div>

                    <div className="flex-grow relative">
                        {activeTab === 'recommended' && (
                            <div className="relative h-full flex items-center justify-center">
                                <div className="grid grid-cols-3 gap-3 w-full">
                                    {inspirationModels.map((model, index) => (
                                        <div 
                                            key={model.url} 
                                            onClick={() => onInspirationSelect(model)}
                                            className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer bg-gray-100"
                                        >
                                            <img
                                                src={model.poster}
                                                alt={`Inspiration ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            <div className="absolute inset-0 p-2 flex flex-col justify-end text-center">
                                                <p className="text-white text-xs font-semibold opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 delay-100">点击加载模型</p>
                                            </div>
                                            <div className="absolute inset-0 rounded-lg ring-2 ring-transparent group-hover:ring-blue-500 transition-all duration-300 pointer-events-none"></div>
                                        </div>
                                    ))}
                                </div>
                                {inspirationModels.length > 3 && (
                                    <>
                                        <button className="absolute left-[-10px] top-1/2 -translate-y-1/2 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100 transition disabled:opacity-50 z-10">
                                            <ChevronLeftIcon className="w-5 h-5 text-gray-600"/>
                                        </button>
                                        <button className="absolute right-[-10px] top-1/2 -translate-y-1/2 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100 transition disabled:opacity-50 z-10">
                                            <ChevronRightIcon className="w-5 h-5 text-gray-600"/>
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                        {activeTab === 'history' && (
                            <div className="flex items-center justify-center h-full text-center text-gray-400">
                                <div>
                                    <p className="font-semibold text-gray-600">暂无历史记录</p>
                                    <p className="text-xs mt-1">登录后可查看您生成的模型</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
          )}
        </div>
    </div>
  );
};

export default GenerationPanel;
