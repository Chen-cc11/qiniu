import { ApiTaskResponse, ApiTaskStatusResponse, ApiUploadResponse, TextToModelPayload, ImageToModelPayload } from '../types';

const API_BASE_URL = '/api';

/**
 * API调用的通用fetch封装
 * @param endpoint API端点
 * @param options fetch选项
 * @returns Promise<T>
 */
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.msg || `Server error: ${response.status} ${response.statusText}`);
    } catch (e) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
  }

  const result = await response.json();
  if (result.code !== 0) {
    throw new Error(result.msg || 'API returned an unknown error');
  }
  return result as T;
}

/**
 * 创建一个文本到模型的任务
 * @param payload 请求负载
 * @returns 任务创建响应
 */
export const textToModel = (payload: TextToModelPayload): Promise<ApiTaskResponse> => {
  return fetchApi<ApiTaskResponse>('/tasks/text-to-model', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

/**
 * 创建一个图片到模型的任务
 * @param payload 请求负载
 * @returns 任务创建响应
 */
export const imageToModel = (payload: ImageToModelPayload): Promise<ApiTaskResponse> => {
    return fetchApi<ApiTaskResponse>('/tasks/image-to-model', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};


/**
 * 上传图片文件
 * @param file 图片文件
 * @returns 图片上传响应
 */
export const uploadImage = async (file: File): Promise<ApiUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // 对于FormData，我们不应该手动设置Content-Type；浏览器会自动处理。
    const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.msg || `Server error: ${response.status} ${response.statusText}`);
      } catch (e) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
    }
    
    const result = await response.json();
    if (result.code !== 0) {
        throw new Error(result.msg || 'API returned an unknown error');
    }
    return result as ApiUploadResponse;
};


/**
 * 获取任务状态
 * @param taskId 任务ID
 * @returns 任务状态响应
 */
export const getTaskStatus = (taskId: string): Promise<ApiTaskStatusResponse> => {
  return fetchApi<ApiTaskStatusResponse>(`/tasks/status/${taskId}`);
};
