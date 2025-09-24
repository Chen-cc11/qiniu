import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import ParamsPanel from './components/ParamsPanel';
import GenerationPanel from './components/GenerationPanel';
import PreviewPanel from './components/PreviewPanel';
import type { ModelParameters, TaskStatus } from './types';
import { GenerationMode } from './types';
import { DEFAULT_MODEL_PARAMETERS } from './constants';

const API_BASE_URL = 'http://localhost:8080'; // Backend server address
// A pre-generated JWT with payload {"userID": "user123"} and the backend's secret key
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiJ1c2VyMTIzIiwiZXhwIjoxODkzNDU2MDAwfQ.D140GjE-b_T-0e_eYgJ4_w8B_x7kY9a7Z9kZ6cK8d9c';

const App: React.FC = () => {
  const [params, setParams] = useState<ModelParameters>(DEFAULT_MODEL_PARAMETERS);
  const [generationMode, setGenerationMode] = useState<GenerationMode>(GenerationMode.TEXT_TO_3D);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>({ status: 'completed', modelUrl: 'https://cdn.glitch.global/6a83e30f-b7e6-4b2c-b519-5a653894086c/labubu.glb?v=1718873155712' });
  const [prompt, setPrompt] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  
  const handleModeChange = (newMode: GenerationMode) => {
    if (newMode !== generationMode) {
      setGenerationMode(newMode);
      setPrompt('');
      setImageFile(null);
      if (taskStatus.status !== 'processing') {
        // Reset to default view when switching modes unless a task is running
        setTaskStatus({ status: 'completed', modelUrl: 'https://cdn.glitch.global/6a83e30f-b7e6-4b2c-b519-5a653894086c/labubu.glb?v=1718873155712' });
      }
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

  useEffect(() => {
    if (!taskId || taskStatus.status === 'completed' || taskStatus.status === 'failed') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
            }
        });

        if (!response.ok) {
          clearInterval(interval);
          setTaskStatus({ status: 'failed', error: '无法获取任务状态' });
          return;
        }
        
        const data = await response.json();

        switch (data.status) {
          case 'completed':
            clearInterval(interval);
            setTaskStatus({ status: 'completed', modelUrl: data.result_url });
            break;
          case 'processing':
            setTaskStatus({
              status: 'processing',
              progress: data.progress,
              message: 'AI正在处理您的模型细节...',
              eta: undefined
            });
            break;
          case 'failed':
            clearInterval(interval);
            setTaskStatus({ status: 'failed', error: data.error_message || '模型生成失败' });
            break;
          case 'pending':
             setTaskStatus(prev => ({
                status: 'processing',
                progress: prev.status === 'processing' ? (prev.progress ?? 5) : 5,
                message: '任务正在排队等待处理...',
                eta: undefined
             }));
             break;
          default:
            break;
        }
      } catch (error) {
        clearInterval(interval);
        setTaskStatus({ status: 'failed', error: '轮询任务状态时出错' });
      }
    }, 5000);

    return () => clearInterval(interval);

  }, [taskId, taskStatus.status]);


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