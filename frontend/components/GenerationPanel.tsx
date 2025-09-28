import React, { useRef, useEffect, useState } from 'react';
import type { TaskStatus, Model } from '../types';
import { GenerationMode } from '../types';
import { WandIcon, TimeIcon, AiIcon, ImageIcon, XIcon, ChevronLeftIcon, ChevronRightIcon, XCircleIcon, LogoIcon, TrashIcon, SpinnerIcon } from './icons';

interface GenerationPanelProps {
  mode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  imageFile: File | null;
  onImageFileChange: (file: File | null) => void;
  onGenerate: () => void;
  onCancel: () => void; // 新增：中断生成的回调函数
  taskStatus: TaskStatus;
  recommendedModels: Model[];
  historyModels: Model[];
  onModelSelect: (model: Model) => void;
  onDeleteModel: (model: Model) => void;
}

interface ModelThumbnailProps {
  model: Model;
  onSelect: (model: Model) => void;
  onDelete?: (model: Model) => void;
}

const ModelThumbnail: React.FC<ModelThumbnailProps> = ({ model, onSelect, onDelete }) => {
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) {
            onDelete(model);
        }
    };
    
    return (
        <div 
            onClick={() => onSelect(model)}
            className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer bg-gray-100"
        >
            {model.poster ? (
                <img
                    src={model.poster}
                    alt="Model thumbnail"
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <LogoIcon className="w-10 h-10 text-gray-400" />
                </div>
            )}
            {onDelete && (
                <button
                    onClick={handleDelete}
                    className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-black/75 transition-all z-10"
                    aria-label="删除模型"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute inset-0 p-2 flex flex-col justify-end text-center">
                <p className="text-white text-xs font-semibold opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 delay-100">点击加载模型</p>
            </div>
            <div className="absolute inset-0 rounded-lg ring-2 ring-transparent group-hover:ring-blue-500 transition-all duration-300 pointer-events-none"></div>
        </div>
    );
};

// 新增：辅助函数，用于将秒格式化为用户友好的字符串
const formatRemainingTime = (seconds?: number): string => {
  if (seconds === undefined || seconds < 0) {
    return '计算中...';
  }
  if (seconds === 0) {
    return '即将完成...';
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0) {
    return `${minutes}分 ${remainingSeconds}秒`;
  }
  return `${remainingSeconds}秒`;
};

// 改进：为生成过程提供动态、信息丰富的状态消息
const PROCESSING_MESSAGES = [
  '正在初始化生成环境...',
  'AI正在解析您的指令...',
  '构建基础模型结构...',
  '雕刻核心模型细节...',
  '生成高分辨率纹理...',
  '进行最终渲染和优化...',
  '即将完成，请稍候...'
];


const GenerationPanel: React.FC<GenerationPanelProps> = ({ mode, onModeChange, prompt, onPromptChange, imageFile, onImageFileChange, onGenerate, onCancel, taskStatus, recommendedModels, historyModels, onModelSelect, onDeleteModel }) => {
    
  const isProcessing = taskStatus.status === 'processing';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'recommended' | 'history'>('recommended');
  
  // 新增：为推荐和历史记录添加分页状态
  const [recommendedPage, setRecommendedPage] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);
  const ITEMS_PER_PAGE = 3;

  // 改进：添加状态以循环显示处理消息
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);


  // 新增：计算分页数据
  const recommendedTotalPages = Math.ceil((recommendedModels?.length || 0) / ITEMS_PER_PAGE);
  const historyTotalPages = Math.ceil((historyModels?.length || 0) / ITEMS_PER_PAGE);

  const displayedRecommendedModels = (recommendedModels || []).slice(
      recommendedPage * ITEMS_PER_PAGE,
      (recommendedPage + 1) * ITEMS_PER_PAGE
  );
  
  const displayedHistoryModels = (historyModels || []).slice(
      historyPage * ITEMS_PER_PAGE,
      (historyPage + 1) * ITEMS_PER_PAGE
  );

  const StatusIndicator = () => {
    if (taskStatus.status === 'processing') {
        return (
            <div className="flex items-center space-x-1.5 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full animate-fade-in">
                <SpinnerIcon className="w-3 h-3 animate-spin" />
                <span>模型生成中</span>
            </div>
        );
    }

    return (
        <div className="flex items-center space-x-1.5 bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full animate-fade-in">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>模型已就绪</span>
        </div>
    );
  };

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

  // 改进：添加一个 effect 来循环显示处理消息
  useEffect(() => {
      let messageInterval: number | undefined;
      if (isProcessing) {
          setCurrentMessageIndex(0); // 在新任务开始时重置
          messageInterval = window.setInterval(() => {
              setCurrentMessageIndex(prevIndex => (prevIndex + 1) % PROCESSING_MESSAGES.length);
          }, 8000); // 每8秒更换一次消息
      }
      return () => {
          if (messageInterval) {
              clearInterval(messageInterval);
          }
      };
  }, [isProcessing]);


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
              <StatusIndicator />
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
                                    aria-label="移除图片"
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

            {isProcessing ? (
                <button
                    onClick={onCancel}
                    className="w-full mt-4 py-3 text-base font-semibold text-white bg-red-500 rounded-lg flex items-center justify-center space-x-2 hover:bg-red-600 transition-all duration-300"
                >
                    <XCircleIcon className="w-5 h-5" />
                    <span>中断生成</span>
                </button>
            ) : (
                <button
                    onClick={onGenerate}
                    disabled={(mode === GenerationMode.TEXT_TO_3D && prompt.trim() === '') || (mode === GenerationMode.IMAGE_TO_3D && !imageFile)}
                    className="w-full mt-4 py-3 text-base font-semibold text-white bg-blue-500 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-600 transition-all duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
                >
                    <WandIcon className="w-5 h-5" />
                    <span>生成模型</span>
                </button>
            )}
            
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
                          {/* 改进：使用格式化函数显示用户友好的剩余时间 */}
                          <span>预计剩余时间: {formatRemainingTime(taskStatus.eta)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                          <AiIcon className="w-5 h-5"/>
                          {/* 改进：显示动态的、信息丰富的状态消息 */}
                          <span>{PROCESSING_MESSAGES[currentMessageIndex]}</span>
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

                    {/* 修复：重构容器以修复布局跳动并将分页箭头移到外部 */}
                    <div className="flex-grow flex items-center justify-center">
                        {activeTab === 'recommended' && (
                            <div className="w-full flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setRecommendedPage(p => Math.max(0, p - 1))}
                                    disabled={recommendedPage === 0}
                                    className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
                                    aria-label="上一页"
                                    style={{ visibility: recommendedTotalPages > 1 ? 'visible' : 'hidden' }}
                                >
                                    <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                                </button>
                                
                                {displayedRecommendedModels.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-3 w-full">
                                        {displayedRecommendedModels.map((model) => (
                                          <ModelThumbnail key={model.url} model={model} onSelect={onModelSelect} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex-grow flex flex-col items-center justify-center h-full w-full text-center text-gray-400">
                                        <p className="font-semibold text-gray-600">暂无推荐</p>
                                    </div>
                                )}
                                
                                <button
                                    onClick={() => setRecommendedPage(p => Math.min(recommendedTotalPages - 1, p + 1))}
                                    disabled={recommendedPage === recommendedTotalPages - 1}
                                    className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
                                    aria-label="下一页"
                                    style={{ visibility: recommendedTotalPages > 1 ? 'visible' : 'hidden' }}
                                >
                                    <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        )}
                        {activeTab === 'history' && (
                             <div className="w-full flex items-center justify-center gap-2">
                                 <button
                                    onClick={() => setHistoryPage(p => Math.max(0, p - 1))}
                                    disabled={historyPage === 0}
                                    className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
                                    aria-label="上一页"
                                    style={{ visibility: historyTotalPages > 1 ? 'visible' : 'hidden' }}
                                >
                                    <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                                </button>

                                {displayedHistoryModels.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-3 w-full">
                                        {displayedHistoryModels.map((model) => (
                                            <ModelThumbnail key={model.url} model={model} onSelect={onModelSelect} onDelete={onDeleteModel} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex-grow flex flex-col items-center justify-center h-full w-full text-center text-gray-400">
                                        <div>
                                            <p className="font-semibold text-gray-600">暂无历史记录</p>
                                            <p className="text-xs mt-1">保存的模型将显示在这里</p>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => setHistoryPage(p => Math.min(historyTotalPages - 1, p + 1))}
                                    disabled={historyPage === historyTotalPages - 1}
                                    className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
                                    aria-label="下一页"
                                    style={{ visibility: historyTotalPages > 1 ? 'visible' : 'hidden' }}
                                >
                                    <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                                </button>
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