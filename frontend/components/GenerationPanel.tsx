import React, { useRef, useEffect } from 'react';
import type { TaskStatus } from '../types';
import { GenerationMode } from '../types';
import { WandIcon, TimeIcon, AiIcon, ImageIcon, XIcon } from './icons';

interface GenerationPanelProps {
  mode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  imageFile: File | null;
  onImageFileChange: (file: File | null) => void;
  onGenerate: () => void;
  taskStatus: TaskStatus;
}

const GenerationPanel: React.FC<GenerationPanelProps> = ({ mode, onModeChange, prompt, onPromptChange, imageFile, onImageFileChange, onGenerate, taskStatus }) => {
    
  const isProcessing = taskStatus.status === 'processing';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    if (imageFile) {
      url = URL.createObjectURL(imageFile);
      setImagePreviewUrl(url);
    } else {
      setImagePreviewUrl(null);
    }
    // Cleanup URL object when component unmounts or file changes
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
    <div className="space-y-6 h-full">
        <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-bold mb-4 text-gray-800">模型生成</h2>
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
            
            <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <strong>提示:</strong> {mode === GenerationMode.TEXT_TO_3D 
                    ? '尽可能提供详细的材质、尺寸和风格描述。例如: "一个30cm高的陶瓷花瓶, 哑光表面, 带几何图案"'
                    : '请上传清晰、主体突出的图片以获得最佳效果。'}
            </div>
        </div>

        {taskStatus.status === 'processing' && (
            <div className="bg-white p-6 rounded-xl shadow-sm animate-fade-in">
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
        )}
    </div>
  );
};

export default GenerationPanel;