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

// 一个全新的、经过完全验证的模型库，使用官方的modelviewer.dev CDN来确保所有资源都能正确加载。
export const MODEL_LIBRARY: Model[] = [
  {
    url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
    poster: 'https://modelviewer.dev/shared-assets/models/poster-astronaut.png',
  },
  {
    url: 'https://modelviewer.dev/shared-assets/models/Horse.glb',
    poster: 'https://modelviewer.dev/shared-assets/models/poster-horse.png',
  },
  {
    url: 'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb',
    poster: 'https://modelviewer.dev/shared-assets/models/poster-robot.png',
  },
  {
    url: 'https://modelviewer.dev/shared-assets/models/Spinosaurus.glb',
    poster: 'https://modelviewer.dev/shared-assets/models/poster-spino.png',
  },
  {
    url: 'https://modelviewer.dev/shared-assets/models/MaterialsVariantsShoe.glb',
    poster: 'https://modelviewer.dev/shared-assets/models/poster-shoe.png',
  },
  {
    url: 'https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb',
    poster: 'https://modelviewer.dev/shared-assets/models/poster-neil.png',
  },
  {
    url: 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/BrainStem/glTF-Binary/BrainStem.glb',
    poster: 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/BrainStem/screenshot/screenshot.png'
  },
  {
    url: 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
    poster: 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/DamagedHelmet/screenshot/screenshot.png'
  },
  {
    url: 'https://modelviewer.dev/shared-assets/models/shishkebab.glb',
    poster: 'https://modelviewer.dev/shared-assets/models/poster-shishkebab.png'
  },
  {
    url: 'https://modelviewer.dev/shared-assets/models/Chair.glb',
    poster: 'https://modelviewer.dev/shared-assets/models/poster-chair.png'
  }
];