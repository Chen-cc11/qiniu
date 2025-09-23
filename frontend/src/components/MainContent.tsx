import React, { useState, useRef, useEffect } from 'react';
import { GenerationMode, ModelParameters, GalleryItem } from '../../types';
import ModelViewer from './ModelViewer';

const TabButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-t-lg text-sm font-semibold transition-colors ${isActive ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
};

interface MainContentProps {
    params: ModelParameters;
    onGenerationComplete: (item: GalleryItem) => void;
}

const API_BASE_URL = '/api'; // 使用相对路径以适配后端代理

const MainContent: React.FC<MainContentProps> = ({ params, onGenerationComplete }) => {
    const [mode, setMode] = useState<GenerationMode>(GenerationMode.TEXT);
    const [prompt, setPrompt] = useState('A modern sofa, velour material, L-shaped design, metal base');
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [generationStatusText, setGenerationStatusText] = useState('准备就绪');
    const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
    const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [modelUrl, setModelUrl] = useState<string | null>(null);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [currentTaskID, setCurrentTaskID] = useState<string | null>(null);

    useEffect(() => {
        if (!currentTaskID) {
            return;
        }

        setProgress(0);
        setGenerationStatusText('任务已创建，等待处理...');

        const intervalId = setInterval(async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/tasks/status/${currentTaskID}`);
                if (!response.ok) {
                    throw new Error(`服务器错误: ${response.status}`);
                }
                const result = await response.json();
                
                if (result.code !== 0 || !result.data) {
                    // 如果错误信息是任务不存在或已过期，则停止轮询
                    if (result.msg && (result.msg.includes('not found') || result.msg.includes('expired'))) {
                         clearInterval(intervalId);
                         setGenerationStatusText(`任务查询失败: ${result.msg}`);
                         setIsGenerating(false);
                         setCurrentTaskID(null);
                         return;
                    }
                    throw new Error(result.msg || '获取任务状态失败');
                }

                const taskStatus = result.data;

                if (taskStatus.status === 'completed') {
                    clearInterval(intervalId);
                    setProgress(100);
                    setGenerationStatusText('模型生成完成!');
                    // 后端返回的可能是相对路径，需要拼接
                    const finalModelUrl = taskStatus.result.modelURL.startsWith('http') ? taskStatus.result.modelURL : `${window.location.origin}${taskStatus.result.modelURL}`;
                    setModelUrl(finalModelUrl);
                    setDownloadUrl(finalModelUrl); 

                    const newHistoryItem: GalleryItem = {
                        id: Date.now(),
                        title: (mode === GenerationMode.TEXT ? prompt : uploadedImageFile?.name || 'Image generation').substring(0, 20) + '...',
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        details: params.outputFormat,
                        imageUrl: taskStatus.result.thumbnailURL || `https://picsum.photos/seed/${Date.now()}/200/200`
                    };
                    onGenerationComplete(newHistoryItem);
                    setIsGenerating(false);
                    setCurrentTaskID(null);
                } else if (taskStatus.status === 'failed') {
                    clearInterval(intervalId);
                    setGenerationStatusText(`生成失败: ${taskStatus.error || '未知错误'}`);
                    setIsGenerating(false);
                    setCurrentTaskID(null);
                } else {
                    setProgress(taskStatus.progress || 0);
                    const statusMap: { [key: string]: string } = {
                        'pending': '排队中',
                        'processing': '模型生成中'
                    };
                    const currentStatusText = statusMap[taskStatus.status] || taskStatus.status;
                    setGenerationStatusText(`${currentStatusText} (${taskStatus.progress || 0}%)`);
                }
            } catch (error) {
                console.error('轮询失败:', error);
                clearInterval(intervalId);
                setGenerationStatusText(`轮询异常: ${error instanceof Error ? error.message : String(error)}`);
                setIsGenerating(false);
                setCurrentTaskID(null);
            }
        }, 5000); // 轮询间隔调整为5秒

        return () => clearInterval(intervalId);

    }, [currentTaskID, onGenerationComplete, prompt, params.outputFormat, mode, uploadedImageFile]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setGenerationStatusText('正在提交任务...');
        setModelUrl(null);
        setDownloadUrl(null);
        setProgress(0);
        setCurrentTaskID(null);

        try {
            let taskId: string | null = null;

            if (mode === GenerationMode.TEXT) {
                const apiParams = {
                    prompt: prompt,
                    faceLimit: Math.round(5000 + (params.precision / 100) * 95000),
                    texture: true,
                    pbr: true,
                    textureQuality: params.textureQuality,
                    quad: params.outputFormat !== 'STL',
                };

                const response = await fetch(`${API_BASE_URL}/tasks/text-to-model`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(apiParams),
                });
                
                const data = await response.json();
                if (!response.ok || data.code !== 0 || !data.data?.taskID) {
                    throw new Error(data.msg || `创建任务失败: ${response.statusText}`);
                }
                taskId = data.data.taskID;

            } else if (mode === GenerationMode.IMAGE && uploadedImageFile) {
                setGenerationStatusText('正在上传图片...');
                const formData = new FormData();
                formData.append('file', uploadedImageFile);
                
                const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
                    method: 'POST',
                    body: formData,
                });
                
                const uploadData = await uploadResponse.json();
                const imageToken = uploadData.data?.imageToken;

                if (!uploadResponse.ok || uploadData.code !== 0 || !imageToken) {
                    throw new Error(uploadData.msg || '图片上传失败');
                }
                
                setGenerationStatusText('图片上传成功，正在创建任务...');
                const apiParams = {
                    fileToken: imageToken,
                    faceLimit: Math.round(5000 + (params.precision / 100) * 95000),
                    texture: true,
                    pbr: true,
                    textureQuality: 'original_image', // Per backend logic
                    quad: params.outputFormat !== 'STL',
                };
                
                const taskResponse = await fetch(`${API_BASE_URL}/tasks/image-to-model`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(apiParams),
                });

                const taskData = await taskResponse.json();
                if (!taskResponse.ok || taskData.code !== 0 || !taskData.data?.taskID) {
                    throw new Error(taskData.msg || '创建任务失败');
                }
                taskId = taskData.data.taskID;
            }

            if (taskId) {
                setCurrentTaskID(taskId);
            } else {
                 setIsGenerating(false);
                 setGenerationStatusText('准备就绪');
            }

        } catch (error) {
            console.error("生成请求失败:", error);
            setGenerationStatusText(`请求失败: ${error instanceof Error ? error.message : String(error)}`);
            setIsGenerating(false);
        }
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setUploadedImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const triggerFileSelect = () => fileInputRef.current?.click();

    const handleDownload = async () => {
        if (!downloadUrl) return;

        try {
            // Use a fetch request to get the model file as a blob
            const response = await fetch(downloadUrl);
            if (!response.ok) {
                throw new Error(`下载模型失败: ${response.statusText}`);
            }
            const blob = await response.blob();
            
            // Create a temporary link to trigger the download
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);

            const fileExtension = params.outputFormat.toLowerCase();
            const promptFileName = mode === GenerationMode.TEXT 
                ? prompt.substring(0, 20).replace(/\s/g, '_')
                : uploadedImageFile?.name.split('.')[0] || 'image_model';
            
            const fileName = `${promptFileName}.${fileExtension}`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            
            // Clean up the temporary link
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error("下载失败:", error);
            alert(`下载失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    return (
        <div className="flex-1 flex flex-col space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 pb-0">
                <div className="flex">
                    <TabButton 
                        label="文本描述生成" 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm5 3a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" /></svg>}
                        isActive={mode === GenerationMode.TEXT}
                        onClick={() => setMode(GenerationMode.TEXT)}
                    />
                     <TabButton 
                        label="图片生成模型" 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>}
                        isActive={mode === GenerationMode.IMAGE}
                        onClick={() => setMode(GenerationMode.IMAGE)}
                    />
                </div>
            </div>

            {mode === GenerationMode.TEXT && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">模型描述</label>
                        <textarea
                            rows={3}
                            className="w-full bg-gray-50 border border-gray-200 rounded-md p-3 text-sm placeholder-gray-400 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="例如：一个现代风格的丝绒材质L型沙发，带有金属底座"
                        ></textarea>
                    </div>
                    <div className="flex justify-end items-center mt-6">
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg flex items-center space-x-2 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                            <span>{isGenerating ? '生成中...' : '生成'}</span>
                        </button>
                    </div>
                </div>
            )}

            {mode === GenerationMode.IMAGE && (
                 <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div 
                        className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={triggerFileSelect}
                    >
                        {uploadedImagePreview ? (
                            <img src={uploadedImagePreview} alt="Uploaded preview" className="max-h-full max-w-full rounded-md object-contain" />
                        ) : (
                            <>
                                <input type="file" accept="image/jpeg,image/png,image/webp" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 15l-4-4m0 0l4-4m-4 4h12" /></svg>
                                <p className="text-sm text-gray-500">拖拽图片到这里或<span className="font-semibold text-orange-500">点击上传</span></p>
                                <p className="text-xs text-gray-400 mt-1">支持 JPG, PNG, WEBP</p>
                            </>
                        )}
                    </div>
                     <div className="flex justify-end items-center mt-6">
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating || !uploadedImageFile}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg flex items-center space-x-2 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                            <span>{isGenerating ? '生成中...' : '生成'}</span>
                        </button>
                    </div>
                </div>
            )}
            
            {(isGenerating || modelUrl) && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">生成进度</h3>
                    <div className="relative">
                        <div className="flex justify-between items-center mb-1">
                            <div className="text-sm text-gray-500">
                                <span className="text-indigo-500 font-medium">{generationStatusText}</span>
                            </div>
                            <span className="text-sm font-bold text-indigo-600">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500 ease-linear" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-gray-800 rounded-2xl shadow-sm p-1 flex-1 flex flex-col min-h-0">
                <ModelViewer modelUrl={modelUrl} />
                <div className="p-4 flex items-center space-x-3">
                    <button 
                        onClick={handleDownload}
                        disabled={!downloadUrl || isGenerating}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2 text-sm disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        <span>下载模型</span>
                    </button>
                    <button className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        <span>复制到项目</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MainContent;
