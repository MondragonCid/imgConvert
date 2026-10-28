import React, { useRef, useState, DragEvent } from 'react';
import { FolderDown, FolderPlus, Upload, Sparkles, CheckCircle2 } from 'lucide-react';
import { scanDataTransferItems } from '../utils/fileScanner';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  onLoadSamples: () => void;
  isProcessing: boolean;
  totalLoaded: number;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  onLoadSamples,
  isProcessing,
  totalLoaded,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer && e.dataTransfer.items) {
      setIsScanning(true);
      try {
        const files = await scanDataTransferItems(e.dataTransfer.items);
        if (files.length > 0) {
          onFilesSelected(files);
        }
      } catch (err) {
        console.error('Error scanning dropped items:', err);
      } finally {
        setIsScanning(false);
      }
    } else if (e.dataTransfer && e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onFilesSelected(files);
      }
    }
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <section id="dropzone" className="w-full">
      {/* Hidden Inputs for Folder and Files */}
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is standard for folder picker in modern browsers
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
        onChange={handleFolderChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpe,.jpg,.jpeg,.png,.webp,.bmp,image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl transition-all duration-200 p-8 text-center flex flex-col items-center justify-center cursor-pointer ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.005]'
            : 'border-slate-700 hover:border-slate-600 bg-slate-900/60 hover:bg-slate-900/90'
        }`}
        onClick={() => folderInputRef.current?.click()}
      >
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
          {isScanning ? (
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <FolderDown className="w-7 h-7" />
          )}
        </div>

        <h2 className="text-xl font-semibold text-white mb-1.5">
          {isDragOver ? 'Drop folder or files now' : 'Drop your image folder here'}
        </h2>
        <p className="text-sm text-slate-400 max-w-lg mb-6 leading-relaxed">
          Drop your entire <span className="text-indigo-300 font-mono text-xs px-1.5 py-0.5 bg-slate-800 rounded">input_images</span> directory or individual <span className="text-indigo-300 font-mono text-xs px-1.5 py-0.5 bg-slate-800 rounded">.jpe</span>, <span className="text-slate-300 font-mono text-xs">.jpg</span>, <span className="text-slate-300 font-mono text-xs">.png</span> files.
        </p>

        {/* Buttons for explicit folder / files selection */}
        <div
          className="flex flex-wrap items-center justify-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-600/30 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <FolderPlus className="w-4 h-4" />
            Select Image Folder
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-750 border border-slate-700 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Upload className="w-4 h-4 text-slate-400" />
            Choose Files
          </button>

          <button
            type="button"
            onClick={onLoadSamples}
            disabled={isProcessing}
            className="px-3.5 py-2 text-sm font-medium text-indigo-300 hover:text-indigo-200 bg-indigo-950/40 hover:bg-indigo-950/70 border border-indigo-800/60 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            Load Sample .JPEs
          </button>
        </div>

        {totalLoaded > 0 && (
          <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Currently loaded {totalLoaded} file{totalLoaded === 1 ? '' : 's'} ready for conversion. Drop another folder to append.</span>
          </div>
        )}
      </div>
    </section>
  );
};
