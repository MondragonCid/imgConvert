import { ImageFileItem, ConversionSettings, TargetFormat } from '../types';
import { getFileStem } from './fileScanner';

export function getMimeType(format: TargetFormat): string {
  switch (format) {
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}

export function getFormatExtension(format: TargetFormat): string {
  switch (format) {
    case 'jpeg':
      return '.jpg';
    case 'png':
      return '.png';
    case 'webp':
      return '.webp';
    default:
      return '.jpg';
  }
}

/**
 * Converts a single image item using HTML5 Canvas according to target settings
 */
export async function convertSingleImage(
  item: ImageFileItem,
  settings: ConversionSettings
): Promise<{
  blob: Blob;
  url: string;
  size: number;
  width: number;
  height: number;
  outputName: string;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(item.file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        if (width === 0 || height === 0) {
          reject(new Error('Invalid image dimensions'));
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { alpha: true });

        if (!ctx) {
          reject(new Error('Failed to get 2D rendering context'));
          return;
        }

        // Like Python PIL: if converting to JPEG, JPG does not support alpha (transparency)
        // Draw matte background first (e.g. #FFFFFF) so transparent portions don't turn black
        if (settings.targetFormat === 'jpeg') {
          ctx.fillStyle = settings.matteColor || '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        // Draw the image
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = getMimeType(settings.targetFormat);
        const quality = settings.targetFormat === 'png' ? undefined : settings.quality;

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas export failed'));
              return;
            }

            const stem = getFileStem(item.name);
            const prefix = settings.prefix || '';
            const suffix = settings.suffix || '';
            const ext = getFormatExtension(settings.targetFormat);
            const outputName = `${prefix}${stem}${suffix}${ext}`;
            const url = URL.createObjectURL(blob);

            resolve({
              blob,
              url,
              size: blob.size,
              width,
              height,
              outputName,
            });
          },
          mimeType,
          quality
        );
      } catch (err: any) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to decode image file: ${item.name}`));
    };

    img.src = objectUrl;
  });
}
