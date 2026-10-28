import React from 'react';
import { ImageFileItem, TargetFormat } from '../types';
import { formatBytes } from '../utils/fileScanner';
import { triggerDownload } from '../utils/zipExporter';
import { Download, Trash2, Eye, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

interface ImageListProps {
  items: ImageFileItem[];
  onlyJpeFiles: boolean;
  onRemoveItem: (id: string) => void;
  onCompareItem: (item: ImageFileItem) => void;
  targetFormat: TargetFormat;
}

export const ImageList: React.FC<ImageListProps> = ({
  items,
  onlyJpeFiles,
  onRemoveItem,
  onCompareItem,
  targetFormat,
}) => {
  const displayedItems = onlyJpeFiles
    ? items.filter((item) => item.name.toLowerCase().endsWith('.jpe'))
    : items;

  if (displayedItems.length === 0) {
    return (
      <div className="w-full bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
        <p className="text-sm">No images in queue matching your current filter.</p>
        <p className="text-xs text-slate-600 mt-1">
          {onlyJpeFiles ? 'Disable the ".jpe only" filter or drop .jpe files into the dropzone.' : 'Drop a folder or files above to begin.'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Table Header */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4 w-12">Preview</th>
              <th className="py-3 px-4">Original File</th>
              <th className="py-3 px-4">Dimensions</th>
              <th className="py-3 px-4 text-right">Original Size</th>
              <th className="py-3 px-4">Target</th>
              <th className="py-3 px-4 text-right">Result Size</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {displayedItems.map((item) => {
              const isJpe = item.name.toLowerCase().endsWith('.jpe');
              const percentDiff =
                item.outputSize && item.originalSize
                  ? Math.round(((item.outputSize - item.originalSize) / item.originalSize) * 100)
                  : null;

              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Thumbnail */}
                  <td className="py-2.5 px-4">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shrink-0 flex items-center justify-center">
                      <img
                        src={item.previewUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </td>

                  {/* Name & Folder Path */}
                  <td className="py-2.5 px-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-200 truncate max-w-[220px]" title={item.name}>
                          {item.name}
                        </span>
                        {isJpe && (
                          <span className="text-[10px] font-mono text-indigo-400 font-semibold px-1 py-0.2 bg-indigo-950/80 border border-indigo-800/50 rounded">
                            JPE
                          </span>
                        )}
                      </div>
                      {item.relativePath && item.relativePath !== item.name && (
                        <span className="text-xs font-mono text-slate-500 truncate max-w-[260px]" title={item.relativePath}>
                          {item.relativePath}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Dimensions */}
                  <td className="py-2.5 px-4 font-mono text-xs text-slate-400 tabular-nums">
                    {item.width && item.height ? (
                      `${item.width} × ${item.height}`
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Original Size */}
                  <td className="py-2.5 px-4 font-mono text-xs text-slate-300 text-right tabular-nums">
                    {formatBytes(item.originalSize)}
                  </td>

                  {/* Target Name */}
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-indigo-300">
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span>{item.outputName || `.${targetFormat === 'jpeg' ? 'jpg' : targetFormat}`}</span>
                    </div>
                  </td>

                  {/* Result Size & Ratio */}
                  <td className="py-2.5 px-4 text-right font-mono text-xs tabular-nums">
                    {item.status === 'completed' && item.outputSize ? (
                      <div className="flex flex-col items-end">
                        <span className="text-emerald-400 font-medium">
                          {formatBytes(item.outputSize)}
                        </span>
                        {percentDiff !== null && (
                          <span
                            className={`text-[10px] ${
                              percentDiff < 0 ? 'text-emerald-500' : 'text-amber-500'
                            }`}
                          >
                            {percentDiff > 0 ? `+${percentDiff}%` : `${percentDiff}%`}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Status Indicator */}
                  <td className="py-2.5 px-4 text-center">
                    {item.status === 'completed' && (
                      <div className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Ready</span>
                      </div>
                    )}
                    {item.status === 'processing' && (
                      <div className="inline-flex items-center gap-1 text-xs text-indigo-400 font-medium">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                        <span>Converting</span>
                      </div>
                    )}
                    {item.status === 'pending' && (
                      <span className="text-xs text-slate-400 font-medium">Queued</span>
                    )}
                    {item.status === 'error' && (
                      <div className="inline-flex items-center gap-1 text-xs text-rose-400 font-medium" title={item.errorMessage}>
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span>Failed</span>
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {item.status === 'completed' && item.outputBlob && (
                        <>
                          <button
                            type="button"
                            onClick={() => onCompareItem(item)}
                            className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Compare original vs converted"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerDownload(item.outputBlob!, item.outputName || item.name)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Download converted image"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Remove from queue"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
