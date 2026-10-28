import { ImageFileItem } from '../types';

interface SampleConfig {
  name: string;
  width: number;
  height: number;
  title: string;
  subtitle: string;
  bgGradient: [string, string];
  shapes: string[];
}

const SAMPLES: SampleConfig[] = [
  {
    name: 'dsc_4812_raw.jpe',
    width: 1200,
    height: 800,
    title: 'DSC_4812 Camera Capture',
    subtitle: 'High dynamic range outdoor sample (.jpe)',
    bgGradient: ['#1e3a8a', '#065f46'],
    shapes: ['mountain', 'sun'],
  },
  {
    name: 'scan_archive_1998.jpe',
    width: 900,
    height: 1200,
    title: 'Archival Scan Record',
    subtitle: 'Scanned document graphic (.jpe)',
    bgGradient: ['#78350f', '#451a03'],
    shapes: ['document', 'stamp'],
  },
  {
    name: 'graphic_vector_alpha.jpe',
    width: 1000,
    height: 1000,
    title: 'Geometric Logo Art',
    subtitle: 'Vibrant geometric patterns (.jpe)',
    bgGradient: ['#581c87', '#312e81'],
    shapes: ['cube', 'circles'],
  },
  {
    name: 'product_shot_04.jpe',
    width: 1400,
    height: 900,
    title: 'Studio Product Display',
    subtitle: 'Studio lighting demonstration (.jpe)',
    bgGradient: ['#0f172a', '#334155'],
    shapes: ['pedestal', 'light'],
  },
];

export async function createSampleJpeFiles(): Promise<File[]> {
  const files: File[] = [];

  for (const sample of SAMPLES) {
    const canvas = document.createElement('canvas');
    canvas.width = sample.width;
    canvas.height = sample.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) continue;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, sample.width, sample.height);
    grad.addColorStop(0, sample.bgGradient[0]);
    grad.addColorStop(1, sample.bgGradient[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, sample.width, sample.height);

    // Decorative grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < sample.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, sample.height);
      ctx.stroke();
    }
    for (let y = 0; y < sample.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(sample.width, y);
      ctx.stroke();
    }

    // Modern central geometric composition
    ctx.save();
    ctx.translate(sample.width / 2, sample.height / 2 - 40);

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(0, 0, 160, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Inner filled circle
    ctx.beginPath();
    ctx.arc(0, 0, 120, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fill();

    // Sharp diamond
    ctx.beginPath();
    ctx.moveTo(0, -90);
    ctx.lineTo(90, 0);
    ctx.lineTo(0, 90);
    ctx.lineTo(-90, 0);
    ctx.closePath();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.restore();

    // Typography
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(sample.title, sample.width / 2, sample.height / 2 + 160);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '20px sans-serif';
    ctx.fillText(sample.subtitle, sample.width / 2, sample.height / 2 + 205);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '16px monospace';
    ctx.fillText(`${sample.width} × ${sample.height}px`, sample.width / 2, sample.height / 2 + 240);

    // Export to JPEG blob and rename with .jpe extension
    const blob: Blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', 0.92);
    });

    const file = new File([blob], sample.name, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });

    // Provide relative path mimicking input_images folder
    Object.defineProperty(file, 'webkitRelativePath', {
      value: `input_images/${sample.name}`,
      writable: true,
    });

    files.push(file);
  }

  return files;
}
