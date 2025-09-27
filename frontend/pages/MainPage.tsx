import React, { useState, useCallback, useEffect } from 'react';
import Header from '../components/Header';
import ParamsPanel from '../components/ParamsPanel';
import GenerationPanel from '../components/GenerationPanel';
import PreviewPanel from '../components/PreviewPanel';
import type { ModelParameters, TaskStatus, Model } from '../types';
import { GenerationMode } from '../types';
import { DEFAULT_MODEL_PARAMETERS, LOCAL_MODELS } from '../constants';
import { apiFetch } from '../utils';

const API_BASE_URL = 'http://localhost:8080'; // 后端服务器地址

const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

// 辅助函数：打乱数组 (Fisher-Yates shuffle)
const shuffleArray = (array: Model[]): Model[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};


interface MainPageProps {
    token: string;
    onLogout: () => void;
}

const MainPage: React.FC<MainPageProps> = ({ token, onLogout }) => {
  const [params, setParams] = useState<ModelParameters>(DEFAULT_MODEL_PARAMETERS);
  const [generationMode, setGenerationMode] = useState<GenerationMode>(GenerationMode.TEXT_TO_3D);
  
  // 初始渲染时打乱模型并分发它们
  const [shuffledModels] = useState(() => shuffleArray(LOCAL_MODELS));
  
  const [displayedModel, setDisplayedModel] = useState<Model>(shuffledModels[0]);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>({ status: 'idle' });
  
  const [inspirationModels] = useState<Model[]>(() => 
    shuffledModels.slice(1) // 修复：使用所有剩余的模型作为推荐，以确保分页箭头正确显示
  );
  
  const [prompt, setPrompt] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [history, setHistory] = useState<Model[]>([]);

  useEffect(() => {
    if (token) {
        const decoded = parseJwt(token);
        if (decoded && decoded.email) {
            setUserEmail(decoded.email);
        }
    }
  }, [token]);

  useEffect(() => {
    const storedHistory = localStorage.getItem('modelHistory');
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }
  }, []);

  const handleSaveModel = (modelToSave: Model) => {
    setHistory(prevHistory => {
        // 避免重复
        if (prevHistory.some(m => m.url === modelToSave.url)) {
            return prevHistory;
        }
        const newHistory = [modelToSave, ...prevHistory];
        localStorage.setItem('modelHistory', JSON.stringify(newHistory));
        return newHistory;
    });
  };

  const handleDeleteModel = (modelToDelete: Model) => {
    setHistory(prevHistory => {
        const newHistory = prevHistory.filter(m => m.url !== modelToDelete.url);
        localStorage.setItem('modelHistory', JSON.stringify(newHistory));
        return newHistory;
    });
    // 新增：如果删除的是当前正在预览的模型，则将预览重置为默认模型。
    if (displayedModel.url === modelToDelete.url) {
      setDisplayedModel(shuffledModels[0]);
    }
  };

  const handleModeChange = (newMode: GenerationMode) => {
    if (newMode !== generationMode) {
      setGenerationMode(newMode);
      setPrompt('');
      setImageFile(null);
    }
  };

  const handleModelSelect = (model: Model) => {
    if (taskStatus.status !== 'processing') {
      setDisplayedModel(model);
      setTaskStatus({ status: 'idle' });
    }
  };

  const handleGenerate = useCallback(async () => {
    const isTextMode = generationMode === GenerationMode.TEXT_TO_3D;
    const isImageMode = generationMode === GenerationMode.IMAGE_TO_3D;

    if (taskStatus.status === 'processing' || (isTextMode && prompt.trim() === '') || (isImageMode && !imageFile)) {
      return;
    }

    setTaskId(null);
    setTaskStatus({ status: 'processing', progress: 0, eta: undefined, message: '正在创建任务...' });

    try {
      let data;
      if (isTextMode) {
        // 根据新的API结构构建负载
        const payload: { [key: string]: any } = {
          prompt: prompt,
          faceLimit: params.faceLimit,
          texture: params.texture,
          textureQuality: params.textureQuality,
          quad: params.quad,
        };
        if (params.negativePrompt.trim()) {
          payload.negativePrompt = params.negativePrompt.trim();
        }
        if (params.modelSeed !== null && !isNaN(params.modelSeed)) {
          payload.modelSeed = params.modelSeed;
        }
        if (params.style) { // 只有在选择了有效风格时才发送
            payload.style = params.style;
        }
        
        data = await apiFetch(
          `${API_BASE_URL}/generate/text`,
          {
            method: 'POST',
            body: JSON.stringify(payload),
          },
          token,
          onLogout
        );
      } else { // 图片模式
        // 更新：根据新的API规范，将所有参数与图片文件一起打包到FormData中
        const formData = new FormData();
        formData.append('image', imageFile!);
        formData.append('faceLimit', String(params.faceLimit));
        formData.append('texture', String(params.texture));
        formData.append('textureQuality', params.textureQuality);
        formData.append('textureAlignment', params.textureAlignment);
        formData.append('quad', String(params.quad));
        if (params.style) { // 只有在选择了有效风格时才发送
            formData.append('style', params.style);
        }
        if (params.modelSeed !== null) {
          formData.append('modelSeed', String(params.modelSeed));
        }

        data = await apiFetch(
          `${API_BASE_URL}/generate/image`,
          {
            method: 'POST',
            body: formData,
          },
          token,
          onLogout
        );
      }

      setTaskId(data.taskID);
      setTaskStatus(prev => ({ ...(prev as any), progress: 5, message: '任务已创建，等待处理...' }));

    } catch (error) {
      if (error instanceof Error && error.message === '认证失败') {
        console.log("会话已过期。用户已登出。");
        return;
      }
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setTaskStatus({ status: 'failed', error: `生成请求失败: ${errorMessage}` });
      const randomModel = LOCAL_MODELS[Math.floor(Math.random() * LOCAL_MODELS.length)];
      setDisplayedModel(randomModel);
    }
  }, [prompt, params, taskStatus.status, generationMode, imageFile, token, onLogout]);

  useEffect(() => {
    if (!taskId || taskStatus.status === 'completed' || taskStatus.status === 'failed') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const data = await apiFetch(
          `${API_BASE_URL}/tasks/${taskId}/status`,
          { method: 'GET' },
          token,
          onLogout
        );

        if (data.status === 'completed') {
            clearInterval(interval);
            const newModel = { url: data.result_url, poster: '', isLocal: false };
            setTaskStatus({ status: 'completed', model: newModel });
            setDisplayedModel(newModel);
        } else if (data.status === 'failed') {
            clearInterval(interval);
            setTaskStatus({ status: 'failed', error: data.error_message || '模型生成失败' });
            const randomModel = LOCAL_MODELS[Math.floor(Math.random() * LOCAL_MODELS.length)];
            setDisplayedModel(randomModel);
        } else if (data.status === 'processing' || data.status === 'pending') {
            // 后端真实进度更新（如果API提供）
            // setTaskStatus(prev => ({ ...prev, progress: data.progress, eta: data.eta }));
        }
      } catch (error) {
        clearInterval(interval);
        if (error instanceof Error && error.message === '认证失败') {
          console.log("轮询期间会话已过期。用户已登出。");
        } else {
          setTaskStatus({ status: 'failed', error: '轮询任务状态时出错' });
          const randomModel = LOCAL_MODELS[Math.floor(Math.random() * LOCAL_MODELS.length)];
          setDisplayedModel(randomModel);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [taskId, taskStatus.status, token, onLogout]);

  useEffect(() => {
    if (taskStatus.status !== 'processing') return;

    let currentProgress = taskStatus.progress ?? 5;
    let currentEta = 60;

    const simulationInterval = setInterval(() => {
      if (currentProgress < 95) { currentProgress += 1; }
      if (currentEta > 5) { currentEta -= 1; }

      setTaskStatus(prev => {
        if (prev.status !== 'processing') {
          clearInterval(simulationInterval);
          return prev;
        }
        return { ...prev, progress: currentProgress, eta: currentEta };
      });
    }, 1000);

    return () => clearInterval(simulationInterval);
  }, [taskStatus.status]);

  // 新增：检查当前模型是否已保存在历史记录中
  const isModelSaved = history.some(m => m.url === displayedModel.url);

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans text-gray-800 flex flex-col">
      <Header onLogout={onLogout} userEmail={userEmail} />
      <main className="flex-grow container mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-3">
          {/* 
            修复：为ParamsPanel添加了 'key' 属性。
            当 'generationMode' 改变时，这会强制React重新挂载该组件，
            从而确保UI（例如显示/隐藏“反向提示词”或“纹理对齐”）
            能够可靠地更新。这是一个解决组件在prop变化时未按预期
            重新渲染问题的有效策略。
          */}
          <ParamsPanel
            key={generationMode}
            parameters={params}
            onParametersChange={setParams}
            mode={generationMode}
          />
        </div>
        <div className="lg:col-span-5">
          <GenerationPanel
            mode={generationMode}
            onModeChange={handleModeChange}
            prompt={prompt}
            onPromptChange={setPrompt}
            imageFile={imageFile}
            onImageFileChange={setImageFile}
            onGenerate={handleGenerate}
            taskStatus={taskStatus}
            recommendedModels={inspirationModels}
            historyModels={history}
            onModelSelect={handleModelSelect}
            onDeleteModel={handleDeleteModel}
          />
        </div>
        <div className="lg:col-span-4">
          <PreviewPanel 
            taskStatus={taskStatus} 
            displayedModel={displayedModel} 
            onSaveModel={handleSaveModel}
            onDeleteModel={handleDeleteModel}
            isSaved={isModelSaved}
          />
        </div>
      </main>
    </div>
  );
};

export default MainPage;