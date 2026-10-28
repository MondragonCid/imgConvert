export type TargetFormat = 'jpeg' | 'png' | 'webp';

export interface ImageFileItem {
  id: string;
  file: File;
  name: string;
  originalExtension: string;
  originalSize: number;
  relativePath: string;
  previewUrl: string;
  width?: number;
  height?: number;
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  
  // Output result
  outputBlob?: Blob;
  outputUrl?: string;
  outputSize?: number;
  outputName?: string;
  outputFormat?: TargetFormat;
  convertedAt?: number;
}

export interface ConversionSettings {
  targetFormat: TargetFormat;
  quality: number; // 0.1 to 1.0 (for JPEG/WebP)
  matteColor: string; // for RGBA -> JPEG conversion (default #FFFFFF)
  onlyJpeFiles: boolean; // replicate python script filtering .jpe files
  preserveFolderStructure: boolean;
  prefix: string;
  suffix: string;
}

export interface ConversionStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  totalOriginalBytes: number;
  totalOutputBytes: number;
  elapsedSeconds?: number;
}
