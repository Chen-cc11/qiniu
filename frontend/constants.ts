import type { ModelParameters, Model } from './types';
import { ModelFineness, TextureQuality, MaterialType, LightSource, OutputFormat } from './types';

export const DEFAULT_MODEL_PARAMETERS: ModelParameters = {
  fineness: ModelFineness.LOW,
  textureQuality: TextureQuality.STANDARD,
  materialType: MaterialType.METAL,
  colors: ['#4A90E2', '#50E3C2', '#E35050', '#000000', '#FFFFFF', '#F5A623', '#7ED321'],
  selectedColor: '#4A90E2',
  lightSource: LightSource.STRONG,
  outputFormat: OutputFormat.OBJ,
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
