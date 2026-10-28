import JSZip from 'jszip';
import { ImageFileItem } from '../types';

export async function exportConvertedAsZip(
  items: ImageFileItem[],
  onProgress?: (percent: number, currentFile: string) => void
): Promise<Blob> {
  const zip = new JSZip();
  const completedItems = items.filter(i => i.status === 'completed' && i.outputBlob);

  if (completedItems.length === 0) {
    throw new Error('No completed files to export');
  }

  // Create folder inside zip named 'converted' (matches Python script output_folder="converted")
  const convertedFolder = zip.folder('converted') || zip;

  for (let idx = 0; idx < completedItems.length; idx++) {
    const item = completedItems[idx];
    const fileName = item.outputName || item.name;
    
    // Add file to zip
    convertedFolder.file(fileName, item.outputBlob!);

    if (onProgress) {
      const pct = Math.round(((idx + 1) / completedItems.length) * 100);
      onProgress(pct, fileName);
    }
  }

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(Math.round(metadata.percent), 'Compressing ZIP package...');
      }
    }
  );

  return zipBlob;
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
