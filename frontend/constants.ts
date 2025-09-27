import type { ModelParameters, Model } from './types';

export const DEFAULT_MODEL_PARAMETERS: ModelParameters = {
  negativePrompt: '',
  faceLimit: 50000, // Medium
  texture: true,
  textureQuality: 'standard',
  textureAlignment: 'original_image', // 新增：为纹理对齐设置默认值
  style: '', // '默认'
  quad: false,
  modelSeed: null,
};

// 应用中显示的本地模型库。
export const LOCAL_MODELS: Model[] = [
  {
    url: '/models/Mechanical Dog.glb',
    poster: '/images/Mechanical Dog.webp',
    isLocal: true,
  },
  {
    url: '/models/Umbrella.glb',
    poster: '/images/Umbrella.webp',
    isLocal: true,
  },
  {
    url: '/models/Bell.glb',
    poster: '/images/Bell.webp',
    isLocal: true,
  },
  {
    url: '/models/Cat.glb',
    poster: '/images/Cat.webp',
    isLocal: true,
  },
  {
    url: '/models/Hat.glb',
    poster: '/images/Hat.webp',
    isLocal: true,
  },
  {
    url: '/models/Shoes.glb',
    poster: '/images/Shoes.webp',
    isLocal: true,
  },
  {
    url: '/models/Train.glb',
    poster: '/images/Train.webp',
    isLocal: true,
  },
];