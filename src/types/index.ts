export interface StatusFile {
  id: string;
  uri: string;
  filename: string;
  type: 'image' | 'video';
  timestamp: number;
  size: number;
  isSaved?: boolean;
  duration?: number;
}

export interface StatusFolder {
  path: string;
  exists: boolean;
}
