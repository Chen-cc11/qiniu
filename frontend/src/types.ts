// types.ts (类型定义)

// UI 相关类型
export interface GalleryItem {
  id: number;
  title: string;
  time: string;
  details: string;
  imageUrl: string;
  modelUrl?: string; // 添加 modelUrl 用于重新选择模型
  selected?: boolean;
  badge?: string;
}

export enum GenerationMode {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
}

export interface ModelParameters {
  precision: number; // 代表面数限制
  textureQuality: 'standard' | 'detailed';
  outputFormat: 'OBJ' | 'GLB' | 'STL';
  // 材质和光源暂时仅为UI选项
  material: string;
  lightSource: string;
}

// API 请求体
export interface TextToModelPayload {
  prompt: string;
  faceLimit: number;
  texture: boolean;
  pbr: boolean;
  textureQuality: 'standard' | 'detailed';
  quad: boolean;
}

export interface ImageToModelPayload {
    fileToken: string;
    faceLimit: number;
    texture: boolean;
    pbr: boolean;
    textureQuality: 'original_image';
    quad: boolean;
}

// API 响应体
interface ApiResponse<T> {
  code: number;
  data: T;
  msg?: string;
}

export type ApiTaskResponse = ApiResponse<{
  taskID: string;
}>;

export type ApiUploadResponse = ApiResponse<{
  imageToken: string;
}>;

export type ApiTaskStatusResponse = ApiResponse<{
  taskID: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result: {
    modelURL: string;
    thumbnailURL: string;
  } | null; // 未完成时 result 可能为 null
  error?: string;
}>;
