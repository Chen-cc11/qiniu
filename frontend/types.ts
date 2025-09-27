// FIX: The triple-slash directive for React was removed as it caused a compilation error.
// The `import` statement below is the correct way to include React's types in a module.
// This single fix should resolve all JSX-related errors across the application.

// 修复：导入React使其类型可用于模块增强和JSX内置元素定义。这解决了找不到'react'模块以及无法识别'DetailedHTMLProps'等类型的问题。
import * as React from 'react';

// 修复：扩展React的CSSProperties以允许自定义CSS属性（例如 '--property'）。
// 这解决了在样式对象中使用自定义属性时出现的TypeScript错误。
declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}

// 新增：为面数限制添加预设以优化用户体验。
export enum FaceLimitPreset {
    LOW = '低 (10k面)',
    MEDIUM = '中 (50k面)',
    HIGH = '高 (100k面)'
}

export enum TextureQuality {
    STANDARD = '标准',
    DETAILED = '精细',
}

// 新增：添加模型风格选项。
export enum ModelStyle {
    NONE = '默认',
    CLAY = '黏土',
    GOLD = '金属',
    ANCIENT_BRONZE = '古铜',
    STEAMPUNK = '蒸汽朋克'
}

// 新增：为图片生成模式添加纹理对齐选项。
export enum TextureAlignment {
    ORIGINAL = '原始图像',
    AUTO = 'AI生成',
}


export interface ModelParameters {
    negativePrompt: string;
    faceLimit: number; // 例如: 10000, 50000, 100000
    texture: boolean;
    textureQuality: 'standard' | 'detailed';
    // 新增：纹理对齐方式，用于图生3D模式。
    textureAlignment: 'original_image' | 'ai_generated';
    style: '' | 'object:clay' | 'gold' | 'ancient_bronze' | 'object:steampunk';
    quad: boolean;
    modelSeed: number | null;
}


export enum GenerationMode {
    TEXT_TO_3D = 'TextTo3D',
    IMAGE_TO_3D = 'ImageTo3D'
}

// 用于性能优化，一个新的接口来同时保存模型URL和其海报图。
export interface Model {
  url: string;
  poster: string;
  isLocal?: boolean;
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

// 修复：集中<model-viewer>自定义元素的类型定义。
// 这会增强全局JSX命名空间，使TypeScript能够识别该自定义元素，
// 从而解决关于该属性在JSX.IntrinsicElements上不存在的错误。
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<ModelViewerElement> & {
          src?: string;
          poster?: string;
          reveal?: 'auto' | 'interaction' | 'manual';
          alt?: string;
          'auto-rotate'?: boolean;
          'camera-controls'?: boolean;
          'shadow-intensity'?: string;
          'camera-orbit'?: string;
          'disable-zoom'?: boolean;
          // 修复：添加在PreviewPanel.tsx中使用的缺失的auto-rotate-delay属性
          'auto-rotate-delay'?: string;
        },
        ModelViewerElement
      >;
    }
  }
}