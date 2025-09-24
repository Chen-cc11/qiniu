// types.ts

// UI相关的类型
export interface GalleryItem {
  id: number;
  title: string;
  time: string;
  details: string;
  imageUrl: string;
  modelUrl?: string; // 添加模型URL，用于重新选中查看
  selected?: boolean;
  badge?: string;
}

export enum GenerationMode {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
}

export interface ModelParameters {
  precision: number; // 代表模型的面数限制 (faceLimit)
  textureQuality: 'standard' | 'detailed';
  outputFormat: 'OBJ' | 'GLB' | 'STL';
  // 以下是UI控件对应的参数，不一定全部发送到后端
  material: string;
  lightSource: string;
}

// API 请求体 (Payloads)
export interface TextToModelPayload {
  prompt: string;
  faceLimit: number;
  texture: boolean;
  pbr: boolean;
  textureQuality: 'standard' | 'detailed';
  quad: boolean;
}

// API 响应体 (Responses)

// 修正：任务创建接口返回的是一个扁平结构，没有 'data' 和 'code' 包装层。
export type ApiTaskResponse = {
  taskID: string;
  status: string;
  message: string;
};

// 修正：此类型与后端 task_handler.go 中 GetTaskStatus 的实际响应结构匹配。
export type ApiTaskStatusResponse = {
  // 注意：这里的响应体直接就是后端 gin.H{} 的结构
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result_url: string | null;
  thumbnail_url: string | null;
  error_message?: string;
};
