import type { ModelParameters, Model } from './types';

export const DEFAULT_MODEL_PARAMETERS: ModelParameters = {
  negativePrompt: '',
  faceLimit: 50000, // Medium
  textureQuality: 'standard',
  textureAlignment: 'original_image', 
  style: 'gold',
  quad: false,
  modelSeed: null,
};

// The library of local models to be displayed in the application.
export const LOCAL_MODELS: Model[] = [
  {
    url: '/models/Mechanical Dog.glb',
    poster: '/images/Mechanical Dog.webp',
  },
  {
    url: '/models/Umbrella.glb',
    poster: '/images/Umbrella.webp',
  },
  {
    url: '/models/Bell.glb',
    poster: '/images/Bell.webp',
  },
  {
    url: '/models/Cat.glb',
    poster: '/images/Cat.webp',
  },
  {
    url: '/models/Hat.glb',
    poster: '/images/Hat.webp',
  },
  {
    url: '/models/Shoes.glb',
    poster: '/images/Shoes.webp',
  },
  {
    url: '/models/Train.glb',
    poster: '/images/Train.webp',
  },
];
