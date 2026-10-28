import { ImageFileItem } from '../types';

export const SUPPORTED_EXTENSIONS = ['.jpe', '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif', '.tiff', '.avif'];

export function isImageFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return SUPPORTED_EXTENSIONS.some(ext => lower.endsWith(ext));
}

export function isJpeFile(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.jpe');
}

export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  if (parts.length > 1) {
    return '.' + parts.pop()!.toLowerCase();
  }
  return '';
}

export function getFileStem(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return fileName;
  return fileName.substring(0, lastDot);
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Reads image dimensions asynchronously
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/**
 * Scan entries from DataTransferItemList supporting dropped folders recursively
 */
export async function scanDataTransferItems(items: DataTransferItemList): Promise<File[]> {
  const files: File[] = [];

  const traverseFileTree = async (item: any, path = ''): Promise<void> => {
    if (item.isFile) {
      const file: File = await new Promise((resolve, reject) => {
        item.file(resolve, reject);
      });
      // Attach relative path if not already present
      Object.defineProperty(file, 'webkitRelativePath', {
        value: path + file.name,
        writable: true,
      });
      files.push(file);
    } else if (item.isDirectory) {
      const dirReader = item.createReader();
      const readEntries = async (): Promise<any[]> => {
        const entries: any[] = [];
        let batch: any[];
        do {
          batch = await new Promise((resolve, reject) => {
            dirReader.readEntries(resolve, reject);
          });
          entries.push(...batch);
        } while (batch.length > 0);
        return entries;
      };

      const entries = await readEntries();
      for (const child of entries) {
        await traverseFileTree(child, path + item.name + '/');
      }
    }
  };

  const promises: Promise<void>[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.webkitGetAsEntry) {
      const entry = item.webkitGetAsEntry();
      if (entry) {
        promises.push(traverseFileTree(entry));
      }
    } else {
      const file = item.getAsFile();
      if (file) files.push(file);
    }
  }

  await Promise.all(promises);
  return files;
}

/**
 * Convert standard File array into ImageFileItem models
 */
export async function processFilesToItems(
  rawFiles: File[],
  onlyJpe = false
): Promise<ImageFileItem[]> {
  const filtered = rawFiles.filter(file => {
    if (onlyJpe) {
      return isJpeFile(file.name);
    }
    return isImageFile(file.name);
  });

  const items: ImageFileItem[] = [];

  for (const file of filtered) {
    const previewUrl = URL.createObjectURL(file);
    const id = `${file.name}_${file.size}_${file.lastModified}_${Math.random().toString(36).slice(2, 7)}`;
    const ext = getFileExtension(file.name);
    const relPath = file.webkitRelativePath || file.name;

    items.push({
      id,
      file,
      name: file.name,
      originalExtension: ext,
      originalSize: file.size,
      relativePath: relPath,
      previewUrl,
      status: 'pending',
    });
  }

  // Load dimensions asynchronously in background without blocking
  return items;
}
