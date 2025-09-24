import { ApiTaskResponse, ApiTaskStatusResponse, TextToModelPayload } from '../types';

/* 
 * 注意: 用户登录和注册的API调用已被移除。
 *
 * 原因在于您提供的后端代码中并未实现 /login 和 /register 这两个接口。
 * 为了让应用能够继续使用其他需要认证的API (如模型生成)，
 * 我们在 LoginPage.tsx 中模拟了登录过程，直接生成了一个有效的JWT令牌。
 * 这样，应用就可以在没有后端认证接口的情况下进行功能测试。
 * 
 * 在实际部署时，后端需要实现这些接口，然后前端再恢复相应的API调用。
 */

const API_BASE_URL = '/api';

/**
 * 一个通用的API请求封装函数
 * @param endpoint API接口路径
 * @param options fetch请求的配置选项
 * @returns Promise<T>
 */
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('authToken');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 如果存在token，则在请求头中添加Authorization
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // 如果响应状态码不为ok，则尝试解析错误信息并抛出异常
  if (!response.ok) {
    // 优化错误处理：专门处理 404 Not Found
    if (response.status === 404) {
      throw new Error(`请求的接口地址不存在 (404 Not Found)。请检查后端路由配置是否正确实现了 '${endpoint}' 接口。`);
    }
    
    const contentType = response.headers.get("content-type");
    let errorMessage = `服务器错误: ${response.status} ${response.statusText}`;

    // 仅当响应体是JSON时才尝试解析
    if (contentType && contentType.includes("application/json")) {
        try {
            const errorData = await response.json();
            errorMessage = errorData.msg || errorData.error || errorData.message || errorMessage;
        } catch (jsonError) {
            console.error("无法解析错误响应的JSON:", jsonError);
        }
    }
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
      const result = await response.json();
      // 后端直接返回业务数据，没有统一的code包装层，所以我们直接返回结果
      return result as T;
  }
  // @ts-ignore
  return {} as T;

}

/**
 * 创建一个文本到模型的任务
 * @param payload 请求负载
 * @returns 任务创建的响应
 */
export const textToModel = (payload: TextToModelPayload): Promise<ApiTaskResponse> => {
  return fetchApi<ApiTaskResponse>('/generate/text', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};


/**
 * 上传图片文件并直接创建任务
 * @param file 图片文件
 * @returns 任务创建的响应
 */
export const createImageTask = async (file: File): Promise<ApiTaskResponse> => {
    const formData = new FormData();
    formData.append('image', file); // 后端 task_handler.go 中期待的字段名是 'image'
    const token = localStorage.getItem('authToken');
    
    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // 注意：当使用FormData时，不要手动设置Content-Type，浏览器会自动处理并添加正确的boundary
    const response = await fetch(`${API_BASE_URL}/generate/image`, {
        method: 'POST',
        body: formData,
        headers,
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.msg || errorData.message || `服务器错误: ${response.status} ${response.statusText}`);
      } catch (e) {
        if (e instanceof Error) throw e;
        throw new Error(`服务器错误: ${response.status} ${response.statusText}`);
      }
    }
    
    return response.json() as Promise<ApiTaskResponse>;
};


/**
 * 获取一个任务的状态
 * @param taskId 任务ID
 * @returns 任务状态的响应
 */
export const getTaskStatus = (taskId: string): Promise<ApiTaskStatusResponse> => {
  return fetchApi<ApiTaskStatusResponse>(`/tasks/${taskId}/status`);
};