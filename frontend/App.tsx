import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import ParamsPanel from './components/ParamsPanel';
import GenerationPanel from './components/GenerationPanel';
import PreviewPanel from './components/PreviewPanel';
import type { ModelParameters, TaskStatus, Model } from './types';
import { GenerationMode } from './types';
import { DEFAULT_MODEL_PARAMETERS, MODEL_LIBRARY } from './constants';

const API_BASE_URL = 'http://localhost:8080/api'; // 后端服务器地址
// 使用后端密钥生成的一个新的、有效的JWT令牌
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiJ1c2VyMTIzIiwiZXhwIjoxNzE4NzMyODQ2fQ.6_MK2O0f8y-_2bd-WSp9c3V2Yy5-fN9J-xK_fUprTRg';

// 从模型库中获取不重复的随机模型的辅助函数
const getRandomModels = (count: number): Model[] => {
  const shuffled = [...MODEL_LIBRARY].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};


const App: React.FC = () => {
  const [params, setParams] = useState<ModelParameters>(DEFAULT_MODEL_PARAMETERS);
  const [generationMode, setGenerationMode] = useState<GenerationMode>(GenerationMode.TEXT_TO_3D);
  // 默认将主预览设置为宇航员模型，以提供一致的启动体验。
  const [taskStatus, setTaskStatus] = useState<TaskStatus>(() => {
    const astronautModel = MODEL_LIBRARY.find(m => m.url.includes('Astronaut')) || MODEL_LIBRARY[0];
    return { status: 'completed', model: astronautModel };
  });
  const [prompt, setPrompt] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  // 用于存放3个随机灵感模型的状态
  const [inspirationModels, setInspirationModels] = useState<Model[]>(() => getRandomModels(3));

  
  const handleModeChange = (newMode: GenerationMode) => {
    if (newMode !== generationMode) {
      setGenerationMode(newMode);
      setPrompt('');
      setImageFile(null);
      // 切换模式时不重置视图
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
            'Authorization': `Bearer ${AUTH_TOKEN}`,
          },
          body: JSON.stringify({ prompt }),
        });
      } else { // Image mode
        const formData = new FormData();
        formData.append('image', imageFile!);
        response = await fetch(`${API_BASE_URL}/generate/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
          },
          body: formData,
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '创建任务失败');
      }

      const data = await response.json();
      setTaskId(data.taskID);
      setTaskStatus(prev => ({ ...prev, progress: 5, message: '任务已创建，等待处理...' }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setTaskStatus({ status: 'failed', error: `生成请求失败: ${errorMessage}` });
    }
  }, [prompt, taskStatus.status, generationMode, imageFile]);

  // 此effect用于轮询后端以获取任务的真实状态。
  useEffect(() => {
    if (!taskId || taskStatus.status === 'completed' || taskStatus.status === 'failed') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
            headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        });

        if (!response.ok) { throw new Error('无法获取任务状态'); }
        
        const data = await response.json();

        if (data.status === 'completed') {
            clearInterval(interval);
            // 新生成的模型没有海报图，因此我们提供一个空值。
            setTaskStatus({ status: 'completed', model: { url: data.result_url, poster: '' } });
        } else if (data.status === 'failed') {
            clearInterval(interval);
            setTaskStatus({ status: 'failed', error: data.error_message || '模型生成失败' });
        }
        // 如果状态是'processing'或'pending'，我们让模拟效果来处理UI更新。
        // 我们只需要继续轮询。

      } catch (error) {
        clearInterval(interval);
        setTaskStatus({ status: 'failed', error: '轮询任务状态时出错' });
      }
    }, 2000); // 每2秒轮询一次最终状态

    return () => clearInterval(interval);

  }, [taskId, taskStatus.status]);


  // 此effect通过模拟平滑的进度来提供更好的用户体验。
  useEffect(() => {
    if (taskStatus.status !== 'processing') return;

    // 开始模拟
    let currentProgress = taskStatus.progress ?? 5;
    let currentEta = 60; // 预计剩余时间从60秒开始

    const simulationInterval = setInterval(() => {
      // 不让模拟进度达到100%，后端返回的状态才是完成的唯一依据。
      if (currentProgress < 95) {
        currentProgress += 1;
      }
      // 不让预计剩余时间降至0
      if (currentEta > 5) { 
        currentEta -= 1;
      }

      setTaskStatus(prev => {
        // 确保我们不会覆盖掉可能来自轮询effect的最终状态
        if (prev.status !== 'processing') {
          clearInterval(simulationInterval);
          return prev;
        }
        return {
          ...prev,
          progress: currentProgress,
          eta: currentEta,
        };
      });
    }, 1000);

    return () => clearInterval(simulationInterval);
  }, [taskStatus.status]);


  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans text-gray-800 flex flex-col">
      <Header />
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

export default App;