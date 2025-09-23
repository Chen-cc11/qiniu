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
