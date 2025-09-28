import React, { useState, useCallback, useEffect, useRef } from 'react';
import Header from '../components/Header';
import ParamsPanel from '../components/ParamsPanel';
import GenerationPanel from '../components/GenerationPanel';
import PreviewPanel from '../components/PreviewPanel';
import type { ModelParameters, TaskStatus, Model } from '../types';
import { GenerationMode } from '../types';
import { DEFAULT_MODEL_PARAMETERS, LOCAL_MODELS } from '../constants';
import { apiFetch } from '../utils';

const API_BASE_URL = 'http://localhost:8080'; // 后端服务器地址

// 声明 JSZip，因为它是由<script>标签全局引入的
declare const JSZip: any;


// 辅助函数：解析JWT
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

const MainPage: React.FC<{ token: string, onLogout: () => void }> = ({ token, onLogout }) => {
  const [mode, setMode] = useState<GenerationMode>(GenerationMode.TEXT_TO_3D);
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [parameters, setParameters] = useState<ModelParameters>(DEFAULT_MODEL_PARAMETERS);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>({ status: 'idle' });
  const [taskId, setTaskId] = useState<string | null>(null);
  const [displayedModel, setDisplayedModel] = useState<Model>(LOCAL_MODELS[0]);
  const [recommendedModels, setRecommendedModels] = useState<Model[]>([]);
  const [userHistory, setUserHistory] = useState<Model[]>([]);
  
  const pollIntervalRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null); // 新增：为进度模拟器添加ref
  const [pollCount, setPollCount] = useState(0);
  const MAX_POLLS = 60; // 5分钟超时 (60 * 5s)

  const userEmail = parseJwt(token)?.email || null;
  const isModelSaved = userHistory.some(m => m.url === displayedModel.url && !m.isLocal);

  // 新增：在组件挂载时打乱推荐模型
  useEffect(() => {
    setRecommendedModels(shuffleArray(LOCAL_MODELS));
  }, []);
  
  // 新增：在组件挂载时从localStorage加载历史记录
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('modelHistory');
      if (savedHistory) {
        setUserHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("无法加载或解析模型历史记录:", error);
      setUserHistory([]);
    }
  }, []);

  // 新增：当历史记录更新时，保存到localStorage
  useEffect(() => {
    try {
      localStorage.setItem('modelHistory', JSON.stringify(userHistory));
    } catch (error) {
      console.error("无法保存模型历史记录:", error);
    }
  }, [userHistory]);

  const handleLogoutAndClear = () => {
    if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
    }
    if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
    }
    onLogout();
  };
  
  const handleUnauthorized = useCallback(() => {
    console.error("认证失败或令牌过期，正在登出。");
    handleLogoutAndClear();
  }, [onLogout]);

    
  // 新增：处理从ZIP文件中提取模型的核心逻辑
  const handleModelExtraction = useCallback(async (modelData: { result_url: string, thumbnail_url: string }) => {
    try {
        // 后端有一个代理来避免CORS问题
        const proxiedUrl = `${API_BASE_URL}/proxy/model?url=${encodeURIComponent(modelData.result_url)}`;
        const response = await fetch(proxiedUrl);
        
        if (!response.ok) {
            throw new Error(`下载模型压缩包失败 (状态码: ${response.status})。`);
        }

        const zipBlob = await response.blob();
        const zip = await JSZip.loadAsync(zipBlob);
        
        let glbFile: any = null;
        zip.forEach((relativePath: string, file: any) => {
            if (relativePath.toLowerCase().endsWith('.glb')) {
                glbFile = file;
            }
        });

        if (!glbFile) {
            throw new Error('压缩包中未找到.glb模型文件。');
        }
        
        const glbBlob = await glbFile.async('blob');
        const modelUrl = URL.createObjectURL(glbBlob);

        const newModel: Model = { url: modelUrl, poster: modelData.thumbnail_url || '' };
        
        setDisplayedModel(newModel);
        setTaskStatus({ status: 'completed', model: newModel });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '发生未知错误。';
        setTaskStatus({ status: 'failed', error: `模型解压失败: ${errorMessage}` });
    }
  }, []);


  const pollTaskStatus = useCallback(async (currentTaskId: string) => {
    // 增加轮询计数器
    setPollCount(prevCount => {
        if (prevCount + 1 >= MAX_POLLS) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            pollIntervalRef.current = null;
            progressIntervalRef.current = null;
            setTaskStatus({ status: 'failed', error: '任务超时，请稍后重试。' });
        }
        return prevCount + 1;
    });

    try {
        const url = `${API_BASE_URL}/tasks/${currentTaskId}/status`;
        const data = await apiFetch(url, { method: 'GET' }, token, handleUnauthorized);
        
        const { status, estimated_remaining_time, result_url, thumbnail_url, error_message } = data;

        const stopPolling = () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            pollIntervalRef.current = null;
            progressIntervalRef.current = null;
            setPollCount(0);
        };

        switch (status) {
            case 'completed':
            case 'DONE':
                stopPolling();
                setTaskStatus(prev => ({ ...prev, status: 'processing', progress: 100 })); // 最终进度100%
                if (result_url && result_url.toLowerCase().endsWith('.zip')) {
                    setTaskStatus({ status: 'unzipping' });
                    handleModelExtraction({ result_url, thumbnail_url });
                } else if (result_url) {
                    const newModel = { url: result_url, poster: thumbnail_url };
                    setDisplayedModel(newModel);
                    setTaskStatus({ status: 'completed', model: newModel });
                } else {
                    setTaskStatus({ status: 'failed', error: '任务完成但未返回模型URL。' });
                }
                break;
            case 'failed':
                stopPolling();
                setTaskStatus({ status: 'failed', error: error_message || '任务失败，未提供具体原因。' });
                break;
            case 'processing':
            case 'RUN':
                // 修复：仅更新ETA，让前端模拟器处理进度条，避免跳动
                setTaskStatus(prev => {
                    if (prev.status === 'processing' || prev.status === 'idle') {
                        return { 
                            ...prev, 
                            status: 'processing',
                            eta: estimated_remaining_time,
                        };
                    }
                    return prev;
                });
                break;
            default:
                break;
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "未知错误";
        if (errorMessage === '认证失败') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            pollIntervalRef.current = null;
            progressIntervalRef.current = null;
        }
    }
  }, [token, handleUnauthorized, handleModelExtraction]);

  // 新增：中断生成任务的函数
  const handleCancelGeneration = useCallback(() => {
      if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
      }
      if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
      }
      setTaskStatus({ status: 'idle' });
      setTaskId(null);
      setPollCount(0);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (taskStatus.status === 'processing' || taskStatus.status === 'unzipping') return;

    // 清理之前的任务状态
    handleCancelGeneration();
    
    // 修复：改进进度模拟，使其更平滑且独立于后端响应
    let progress = 5;
    setTaskStatus({ status: 'processing', progress: 5, eta: 300, message: '正在初始化...' });

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = window.setInterval(() => {
        setTaskStatus(prev => {
            if (prev.status === 'processing') {
                // 模拟进度条缓慢增长，但在90%处停止，等待最终结果
                const newProgress = prev.progress ? Math.min(90, prev.progress + 2) : 5;
                return { ...prev, progress: newProgress };
            }
            return prev;
        });
    }, 2000);


    let url: string;
    let body: any;

    if (mode === GenerationMode.TEXT_TO_3D) {
      url = `${API_BASE_URL}/generate/text`;
      const textParams = {
          prompt,
          face_limit: parameters.faceLimit,
          texture: parameters.texture,
          texture_quality: parameters.textureQuality,
          style: parameters.style,
          quad: parameters.quad,
          negative_prompt: parameters.negativePrompt,
          model_seed: parameters.modelSeed,
      };
      body = JSON.stringify(textParams);
    } else {
        if (!imageFile) {
            setTaskStatus({ status: 'failed', error: '请先上传图片。' });
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            return;
        }
        url = `${API_BASE_URL}/generate/image`;
        const formData = new FormData();
        formData.append('image', imageFile);
        const imageParams = {
            face_limit: parameters.faceLimit,
            texture: parameters.texture,
            texture_quality: parameters.textureQuality,
            style: parameters.style,
            quad: parameters.quad,
            texture_alignment: parameters.textureAlignment,
            model_seed: parameters.modelSeed,
        };
        Object.entries(imageParams).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              formData.append(key, String(value));
            }
        });
        body = formData;
    }

    try {
      const data = await apiFetch(url, { method: 'POST', body }, token, handleUnauthorized);
      const newTaskId = data.taskID || data.task_id;

      if (!newTaskId) {
        const errorMessage = data.message || '响应中未找到task_id。';
        throw new Error(errorMessage);
      }
      
      setTaskId(newTaskId);

      // 立即开始轮询
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = window.setInterval(() => {
        pollTaskStatus(newTaskId);
      }, 5000);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '发生未知错误';
        setTaskStatus({ status: 'failed', error: `生成请求失败: ${errorMessage}` });
        // 请求失败时，清理所有定时器
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
  }, [mode, prompt, imageFile, parameters, taskStatus.status, token, handleUnauthorized, pollTaskStatus, handleCancelGeneration]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);
  
  const handleSaveModel = useCallback((modelToSave: Model) => {
    setUserHistory(prev => {
        // 检查模型是否已存在（基于URL）
        if (prev.some(m => m.url === modelToSave.url)) {
            return prev;
        }
        // 将新模型添加到历史记录的开头
        return [modelToSave, ...prev];
    });
  }, []);

  const handleDeleteModel = useCallback((modelToDelete: Model) => {
    setUserHistory(prev => prev.filter(m => m.url !== modelToDelete.url));
    // 如果删除的是当前显示的模型，则切换到默认模型
    if (displayedModel.url === modelToDelete.url) {
        setDisplayedModel(LOCAL_MODELS[0]);
    }
  }, [displayedModel]);
  

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col">
      <Header onLogout={handleLogoutAndClear} userEmail={userEmail} />
      <main className="flex-grow container mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          <div className="lg:col-span-3">
            <GenerationPanel
              mode={mode}
              onModeChange={setMode}
              prompt={prompt}
              onPromptChange={setPrompt}
              imageFile={imageFile}
              onImageFileChange={setImageFile}
              onGenerate={handleGenerate}
              onCancel={handleCancelGeneration}
              taskStatus={taskStatus}
              recommendedModels={recommendedModels}
              historyModels={userHistory}
              onModelSelect={setDisplayedModel}
              onDeleteModel={handleDeleteModel}
            />
          </div>
          <div className="lg:col-span-6">
            <PreviewPanel
                taskStatus={taskStatus}
                displayedModel={displayedModel}
                onSaveModel={handleSaveModel}
                onDeleteModel={handleDeleteModel}
                isSaved={isModelSaved}
            />
          </div>
          <div className="lg:col-span-3">
            <ParamsPanel
              parameters={parameters}
              onParametersChange={setParameters}
              mode={mode}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainPage;