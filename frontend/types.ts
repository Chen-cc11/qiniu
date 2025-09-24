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

export type TaskStatus = 
    | { status: 'idle' }
    | { status: 'processing'; progress?: number; eta?: number; message?: string }
    | { status: 'completed'; modelUrl: string }
    | { status: 'failed'; error: string };