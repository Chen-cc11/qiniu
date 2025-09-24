import type { ModelParameters } from './types';
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