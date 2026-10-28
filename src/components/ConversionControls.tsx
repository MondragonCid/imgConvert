import React from 'react';
import { TargetFormat, ConversionSettings } from '../types';
import { Play, Download, RotateCcw, Sliders, CheckCircle } from 'lucide-react';

interface ConversionControlsProps {
  settings: ConversionSettings;
  onSettingsChange: (settings: ConversionSettings) => void;
  onStartConversion: () => void;
  onDownloadZip: () => void;
  onClear: () => void;
  isConverting: boolean;
  progressPercent: number;
  totalCount: number;
  completedCount: number;
  jpeOnlyCount: number;
}

export const ConversionControls: React.FC<ConversionControlsProps> = ({
  settings,
  onSettingsChange,
  onStartConversion,
  onDownloadZip,
  onClear,
  isConverting,
  progressPercent,
  totalCount,
  completedCount,
  jpeOnlyCount,
}) => {
  const activeCount = settings.onlyJpeFiles ? jpeOnlyCount : totalCount;
  const isDone = completedCount > 0 && completedCount === activeCount;

  return (
    <section id="settings" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Left: Format & Options */}
        <div className="flex flex-wrap items-center gap-6">
          
          {/* Target Format Segmented Control */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Target Format
            </label>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => onSettingsChange({ ...settings, targetFormat: 'jpeg' })}
                disabled={isConverting}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                  settings.targetFormat === 'jpeg'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                JPG / JPEG
              </button>
              <button
                type="button"
                onClick={() => onSettingsChange({ ...settings, targetFormat: 'png' })}
                disabled={isConverting}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                  settings.targetFormat === 'png'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                PNG
              </button>
              <button
                type="button"
                onClick={() => onSettingsChange({ ...settings, targetFormat: 'webp' })}
                disabled={isConverting}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                  settings.targetFormat === 'webp'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                WebP
              </button>
            </div>
          </div>

          {/* Quality Slider (JPG / WebP) */}
          {settings.targetFormat !== 'png' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-slate-300 uppercase tracking-wider">Quality</span>
                <span className="font-mono text-indigo-400 font-semibold">{Math.round(settings.quality * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={settings.quality}
                  disabled={isConverting}
                  onChange={(e) => onSettingsChange({ ...settings, quality: parseFloat(e.target.value) })}
                  className="w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Background Matte for JPG */}
          {settings.targetFormat === 'jpeg' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Matte (Transparent Fill)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.matteColor}
                  disabled={isConverting}
                  onChange={(e) => onSettingsChange({ ...settings, matteColor: e.target.value })}
                  className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                  title="Matte color to fill transparent pixels when converting to JPG"
                />
                <span className="text-xs font-mono text-slate-400">{settings.matteColor}</span>
              </div>
            </div>
          )}

          {/* Filter: Only .jpe files toggle (Python script mode) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              File Selection
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none py-1">
              <input
                type="checkbox"
                checked={settings.onlyJpeFiles}
                disabled={isConverting}
                onChange={(e) => onSettingsChange({ ...settings, onlyJpeFiles: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Only convert <span className="font-mono text-indigo-300">.jpe</span> files</span>
              <span className="text-slate-500 font-mono text-[11px]">({jpeOnlyCount} found)</span>
            </label>
          </div>
        </div>

        {/* Right: Primary Conversion Action */}
        <div className="flex items-center gap-3">
          {totalCount > 0 && (
            <button
              type="button"
              onClick={onClear}
              disabled={isConverting}
              className="px-3.5 py-2.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
              title="Clear all images"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}

          {isDone ? (
            <button
              type="button"
              onClick={onDownloadZip}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/30 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Download All (converted.zip)
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartConversion}
              disabled={isConverting || activeCount === 0}
              className={`px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                isConverting
                  ? 'bg-indigo-700 cursor-wait opacity-90'
                  : activeCount === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-md shadow-indigo-600/25'
              }`}
            >
              {isConverting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Converting ({progressPercent}%)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Convert {activeCount > 0 ? `${activeCount} Image${activeCount === 1 ? '' : 's'}` : 'Images'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar during conversion */}
      {isConverting && (
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Converting batch...</span>
            <span className="font-mono font-medium text-indigo-400">{completedCount} of {activeCount} files</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
};
