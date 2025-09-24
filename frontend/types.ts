export interface GalleryItem {
  id: number;
  title: string;
  time: string;
  details: string;
  imageUrl: string;
  selected?: boolean;
  badge?: string;
}

export enum GenerationMode {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
}

export interface ModelParameters {
  precision: number;
  textureQuality: 'standard' | 'detailed';
  material: string;
  lightSource: string;
  outputFormat: 'OBJ' | 'GLB' | 'STL';
}

// API Payloads
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


// API Responses
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
  };
  error?: string;
}>;
