import React, { useState } from 'react';
import { ImageFileItem } from '../types';
import { formatBytes } from '../utils/fileScanner';
import { triggerDownload } from '../utils/zipExporter';
import { X, Download, SlidersHorizontal, ArrowLeftRight } from 'lucide-react';

interface ComparisonModalProps {
  item: ImageFileItem | null;
  onClose: () => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({ item, onClose }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [mode, setMode] = useState<'slider' | 'side-by-side'>('slider');

  if (!item || !item.outputUrl) return null;

  const originalSizeFormatted = formatBytes(item.originalSize);
  const outputSizeFormatted = item.outputSize ? formatBytes(item.outputSize) : '—';
  const sizeDiffPercent = item.outputSize
    ? Math.round(((item.outputSize - item.originalSize) / item.originalSize) * 100)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex flex-col">
            <h3 className="text-base font-semibold text-white truncate max-w-md">
              {item.name}
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {item.width && item.height ? `${item.width} × ${item.height}px` : 'Image comparison'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* View mode toggle */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setMode('slider')}
                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                  mode === 'slider' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Split Slider
              </button>
              <button
                type="button"
                onClick={() => setMode('side-by-side')}
                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                  mode === 'side-by-side' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Side by Side
              </button>
            </div>

            <button
              type="button"
              onClick={() => triggerDownload(item.outputBlob!, item.outputName || item.name)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download Converted
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Comparison Viewport */}
        <div className="relative flex-1 min-h-[350px] max-h-[550px] p-6 bg-slate-950 flex items-center justify-center overflow-hidden">
          {mode === 'slider' ? (
            <div className="relative w-full h-[400px] flex items-center justify-center select-none overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
              {/* Converted Image (Right side / Full background) */}
              <img
                src={item.outputUrl}
                alt="Converted preview"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />
              <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur px-2 py-1 rounded text-[11px] font-mono text-emerald-400 border border-slate-700/80">
                Converted: {item.outputName} ({outputSizeFormatted})
              </div>

              {/* Original Image (Left side / Clipped) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={item.previewUrl}
                  alt="Original preview"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  style={{
                    width: '100%',
                    maxWidth: 'none',
                  }}
                />
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur px-2 py-1 rounded text-[11px] font-mono text-indigo-400 border border-slate-700/80">
                  Original: {item.name} ({originalSizeFormatted})
                </div>
              </div>

              {/* Slider Divider Line & Handle */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize z-20"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-900">
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Interactive Range Input overlay */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 w-full h-[400px]">
              {/* Original */}
              <div className="relative rounded-xl border border-slate-800 bg-slate-900/50 p-2 flex flex-col items-center justify-center overflow-hidden">
                <span className="absolute top-2 left-2 text-[11px] font-mono text-indigo-400 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
                  Original: {originalSizeFormatted}
                </span>
                <img
                  src={item.previewUrl}
                  alt="Original"
                  className="max-h-full max-w-full object-contain rounded"
                />
              </div>

              {/* Converted */}
              <div className="relative rounded-xl border border-slate-800 bg-slate-900/50 p-2 flex flex-col items-center justify-center overflow-hidden">
                <span className="absolute top-2 left-2 text-[11px] font-mono text-emerald-400 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
                  Converted: {outputSizeFormatted} ({sizeDiffPercent !== null && sizeDiffPercent < 0 ? `${sizeDiffPercent}%` : `+${sizeDiffPercent}%`})
                </span>
                <img
                  src={item.outputUrl}
                  alt="Converted"
                  className="max-h-full max-w-full object-contain rounded"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer: Metadata summary */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400">
          <div className="flex items-center gap-4 font-mono">
            <span>Original: <strong className="text-slate-200">{originalSizeFormatted}</strong></span>
            <span>&rarr;</span>
            <span>Converted: <strong className="text-emerald-400">{outputSizeFormatted}</strong></span>
            {sizeDiffPercent !== null && (
              <span className={sizeDiffPercent < 0 ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                ({sizeDiffPercent < 0 ? `Saved ${Math.abs(sizeDiffPercent)}%` : `+${sizeDiffPercent}%`})
              </span>
            )}
          </div>
          <span className="text-slate-500">Drag slider left/right to inspect visual quality</span>
        </div>
      </div>
    </div>
  );
};
