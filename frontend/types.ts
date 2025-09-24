import 'react';

// 修复：扩展React的CSSProperties以允许自定义CSS属性（例如 '--property'）。
// 这解决了在样式对象中使用自定义属性时出现的TypeScript错误。
declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}

export enum ModelFineness {
    LOW = '低',
    MEDIUM = '中',
    HIGH = '高'
}

export enum TextureQuality {
    LOW = '低',
    STANDARD = '标准',
    HIGH = '高',
}

export enum MaterialType {
    METAL = '金属',
    VELVET = '绒面',
    CERAMIC = '陶瓷',
    GRID = '网格',
}

export enum LightSource {
    SOFT = '柔和',
    STRONG = '强烈'
}

export enum OutputFormat {
    OBJ = 'OBJ',
    GLB = 'GLB',
    STL = 'STL'
}

export interface ModelParameters {
    fineness: ModelFineness;
    textureQuality: TextureQuality;
    materialType: MaterialType;
    colors: string[];
    selectedColor: string;
    lightSource: LightSource;
    outputFormat: OutputFormat;
}

export enum GenerationMode {
    TEXT_TO_3D = 'TextTo3D',
    IMAGE_TO_3D = 'ImageTo3D'
}

// 用于性能优化，一个新的接口来同时保存模型URL和其海报图。
export interface Model {
  url: string;
  poster: string;
}

export type TaskStatus = 
    | { status: 'idle' }
    | { status: 'processing'; progress?: number; eta?: number; message?: string }
    | { status: 'completed'; model: Model } // 更新为使用新的Model接口
    | { status: 'failed'; error: string };

// 修复：集中并扩展 <model-viewer> 自定义元素的类型定义。
// 这确保了它的属性在整个应用中都能被TypeScript识别。
export interface ModelViewerElement extends HTMLElement {
  cameraOrbit: string;
}

declare global {
  namespace React.JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<ModelViewerElement> & {
          src?: string;
          poster?: string; // 添加poster属性用于性能优化
          reveal?: 'auto' | 'interaction' | 'manual'; // 添加reveal属性用于懒加载
          alt?: string;
          'auto-rotate'?: boolean;
          'camera-controls'?: boolean;
          'shadow-intensity'?: string;
          'camera-orbit'?: string;
          'disable-zoom'?: boolean;
        },
        ModelViewerElement
      >;
    }
  }
}