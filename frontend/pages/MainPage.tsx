import React, { useState, useCallback, useEffect } from 'react';
import Header from '../components/Header';
import ParamsPanel from '../components/ParamsPanel';
import GenerationPanel from '../components/GenerationPanel';
import PreviewPanel from '../components/PreviewPanel';
import type { ModelParameters, TaskStatus, Model } from '../types';
import { GenerationMode } from '../types';
import { DEFAULT_MODEL_PARAMETERS, LOCAL_MODELS } from '../constants';

const API_BASE_URL = 'http://localhost:8080'; // 后端服务器地址

// Helper to parse JWT
const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

// Helper to shuffle an array (Fisher-Yates shuffle)
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
  
  // Shuffle models on initial render and distribute them
  const [shuffledModels] = useState(() => shuffleArray(LOCAL_MODELS));
  
  const [taskStatus, setTaskStatus] = useState<TaskStatus>(() => ({
    status: 'completed',
    model: shuffledModels[0], // Use the first shuffled model for the main preview
  }));
  const [inspirationModels, setInspirationModels] = useState<Model[]>(() => 
    shuffledModels.slice(1, 4) // Use the next 3 for recommendations
  );
  
  const [prompt, setPrompt] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
        const decoded = parseJwt(token);
        if (decoded && decoded.email) {
            setUserEmail(decoded.email);
        }
    }
  }, [token]);


  const handleModeChange = (newMode: GenerationMode) => {
    if (newMode !== generationMode) {
      setGenerationMode(newMode);
      setPrompt('');
      setImageFile(null);
    }
  };

  const handleInspirationSelect = (model: Model) => {
    if (taskStatus.status !== 'processing') {
      setTaskStatus({ status: 'completed', model });
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
      let response: Response;

      if (isTextMode) {
        response = await fetch(`${API_BASE_URL}/generate/text`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ prompt }),
        });
      } else { // Image mode
        const formData = new FormData();
        formData.append('image', imageFile!);
        formData.append('image_url', 'https://modelviewer.dev/shared-assets/models/poster-horse.png');
        
        response = await fetch(`${API_BASE_URL}/generate/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
      }

      if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { message: `HTTP error! status: ${response.status}` };
        }
        throw new Error(errorData.message || '创建任务失败');
      }

      const data = await response.json();
      setTaskId(data.taskID);
      setTaskStatus(prev => ({ ...prev, progress: 5, message: '任务已创建，等待处理...' }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setTaskStatus({ status: 'failed', error: `生成请求失败: ${errorMessage}` });
    }
  }, [prompt, taskStatus.status, generationMode, imageFile, token]);

  useEffect(() => {
    if (!taskId || taskStatus.status === 'completed' || taskStatus.status === 'failed') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) { throw new Error('无法获取任务状态'); }
        
        const data = await response.json();

        if (data.status === 'completed') {
            clearInterval(interval);
            setTaskStatus({ status: 'completed', model: { url: data.result_url, poster: '' } });
        } else if (data.status === 'failed') {
            clearInterval(interval);
            setTaskStatus({ status: 'failed', error: data.error_message || '模型生成失败' });
        }
      } catch (error) {
        clearInterval(interval);
        setTaskStatus({ status: 'failed', error: '轮询任务状态时出错' });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [taskId, taskStatus.status, token]);

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

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans text-gray-800 flex flex-col">
      <Header onLogout={onLogout} userEmail={userEmail} />
      <main className="flex-grow container mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-3">
          <ParamsPanel parameters={params} onParametersChange={setParams} />
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
            inspirationModels={inspirationModels}
            onInspirationSelect={handleInspirationSelect}
          />
        </div>
        <div className="lg:col-span-4">
          <PreviewPanel taskStatus={taskStatus} />
        </div>
      </main>
    </div>
  );
};

export default MainPage;
