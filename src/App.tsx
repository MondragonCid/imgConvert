import React, { useState, useRef, useMemo, useCallback } from 'react';
import { scanDataTransferItems, getImageDimensions, isJpeFile, isImageFile } from './utils/fileScanner';
import { convertSingleImage } from './utils/imageConverter';
import { exportConvertedAsZip, triggerDownload } from './utils/zipExporter';
import { createSampleJpeFiles } from './utils/sampleImages';
import { ImageFileItem } from './types';
import { Folder, FolderOpen, Download, Copy, Check, RefreshCw } from 'lucide-react';

export default function App() {
  const [folderName, setFolderName] = useState('input_images');
  const [outputFolderName, setOutputFolderName] = useState('converted');
  const [targetFormat, setTargetFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [onlyJpe, setOnlyJpe] = useState(true);
  const [items, setItems] = useState<ImageFileItem[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Ready. Select or drop a folder to start.');
  const [logs, setLogs] = useState<string[]>([
    'imgConvert initialized.',
    'Drop a folder containing images (or click "Browse Folder").',
  ]);
  const [isCopied, setIsCopied] = useState(false);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, msg]);
  };

  // Filtered items based on "only .jpe files" checkbox
  const filteredItems = useMemo(() => {
    if (onlyJpe) {
      return items.filter((item) => isJpeFile(item.name));
    }
    return items.filter((item) => isImageFile(item.name));
  }, [items, onlyJpe]);

  const completedCount = useMemo(() => {
    return filteredItems.filter((i) => i.status === 'completed').length;
  }, [filteredItems]);

  // Load dropped or selected files
  const handleFiles = useCallback((files: File[], droppedFolder = '') => {
    if (droppedFolder) {
      setFolderName(droppedFolder);
    }
    const newItems: ImageFileItem[] = files.map((file) => ({
      id: `${file.name}_${file.size}_${Date.now()}_${Math.random()}`,
      file,
      name: file.name,
      originalExtension: '.' + file.name.split('.').pop()?.toLowerCase(),
      originalSize: file.size,
      relativePath: file.webkitRelativePath || file.name,
      previewUrl: URL.createObjectURL(file),
      status: 'pending',
    }));

    setItems(newItems);
    setProgress(0);
    const jpeCount = newItems.filter((f) => isJpeFile(f.name)).length;
    addLog(`\nLoaded ${newItems.length} file(s) from "${droppedFolder || 'input_images'}".`);
    addLog(`Found ${jpeCount} .jpe file(s) (${newItems.length} total images).`);
    setStatusMessage(`Loaded ${newItems.length} files. Click "Convert Images" to start.`);

    // Load dimensions quietly
    newItems.forEach(async (item) => {
      const dims = await getImageDimensions(item.file);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, width: dims.width, height: dims.height } : i))
      );
    });
  }, []);

  // Drag and drop handler
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer && e.dataTransfer.items) {
      try {
        const files = await scanDataTransferItems(e.dataTransfer.items);
        let extractedFolderName = 'input_images';
        if (files[0] && files[0].webkitRelativePath) {
          const parts = files[0].webkitRelativePath.split('/');
          if (parts.length > 1) extractedFolderName = parts[0];
        }
        handleFiles(files, extractedFolderName);
      } catch (err) {
        addLog(`Error scanning dropped folder: ${err}`);
      }
    } else if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Load sample test files
  const handleLoadSamples = async () => {
    try {
      const sampleFiles = await createSampleJpeFiles();
      handleFiles(sampleFiles, 'input_images');
    } catch (err) {
      addLog(`Failed to load samples: ${err}`);
    }
  };

  // Start conversion
  const handleStartConversion = async () => {
    if (filteredItems.length === 0 || isConverting) return;

    setIsConverting(true);
    setProgress(0);
    const targetExt = targetFormat === 'jpeg' ? 'JPG' : 'PNG';
    addLog(`\nStarting conversion to .${targetExt}...`);

    let successCount = 0;
    const total = filteredItems.length;

    for (let i = 0; i < total; i++) {
      const item = filteredItems[i];
      setItems((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'processing' } : f))
      );

      try {
        const res = await convertSingleImage(item, {
          targetFormat,
          quality: 0.95,
          matteColor: '#FFFFFF',
          onlyJpeFiles: onlyJpe,
          preserveFolderStructure: false,
          prefix: '',
          suffix: '',
        });

        successCount++;
        setItems((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  status: 'completed',
                  outputBlob: res.blob,
                  outputUrl: res.url,
                  outputSize: res.size,
                  outputName: res.outputName,
                  width: res.width,
                  height: res.height,
                }
              : f
          )
        );
        addLog(`  [✓] ${item.name} -> ${res.outputName}`);
      } catch (err: any) {
        addLog(`  [✗] Error converting ${item.name}: ${err?.message || err}`);
        setItems((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, status: 'error', errorMessage: String(err) } : f
          )
        );
      }

      const pct = Math.round(((i + 1) / total) * 100);
      setProgress(pct);
      setStatusMessage(`Converting ${i + 1} of ${total} files (${pct}%)...`);
    }

    setIsConverting(false);
    addLog(`\nFinished! Converted ${successCount}/${total} images.`);
    addLog(`Ready to save in "${outputFolderName}/" folder.`);
    setStatusMessage(`Done! Converted ${successCount}/${total} images.`);
  };

  // Download ZIP
  const handleDownloadZip = async () => {
    const readyItems = filteredItems.filter((i) => i.status === 'completed' && i.outputBlob);
    if (readyItems.length === 0) return;

    try {
      const zipBlob = await exportConvertedAsZip(readyItems);
      triggerDownload(zipBlob, `${outputFolderName}.zip`);
      addLog(`Downloaded "${outputFolderName}.zip" with ${readyItems.length} images.`);
    } catch (err) {
      addLog(`Failed to create ZIP: ${err}`);
    }
  };

  // Copy Python code
  const handleCopyPython = async () => {
    try {
      const res = await fetch('/gui_app.py');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      alert('Could not copy automatically. Check gui_app.py in project root.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 text-slate-800 p-4 sm:p-8 flex items-center justify-center font-sans">
      {/* Hidden file inputs */}
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is standard for folder picker in modern browsers
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            let name = 'input_images';
            if (files[0].webkitRelativePath) {
              name = files[0].webkitRelativePath.split('/')[0];
            }
            handleFiles(files, name);
            e.target.value = '';
          }
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpe,.jpg,.jpeg,.png,.webp,image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
            e.target.value = '';
          }
        }}
      />

      {/* Main Standard Desktop Box */}
      <div className="w-full max-w-2xl bg-white border border-slate-300 rounded shadow-md overflow-hidden flex flex-col">
        
        {/* Title Bar */}
        <div className="bg-slate-100 border-b border-slate-300 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-slate-600" />
            <span className="font-semibold text-sm text-slate-900">imgConvert</span>
            <span className="text-xs text-slate-500">· Batch Image Converter</span>
          </div>
          <button
            type="button"
            onClick={handleCopyPython}
            className="text-xs text-slate-600 hover:text-slate-900 border border-slate-300 bg-white hover:bg-slate-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
            title="Copy simple Python code for Visual Studio"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied Python code' : 'Copy Python code'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-4 text-sm">
          
          {/* 1. Input Folder */}
          <div className="border border-slate-300 rounded p-3 bg-slate-50">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Input Folder
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="flex-1 bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-slate-500 font-mono"
              />
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap"
              >
                Browse Folder...
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap"
              >
                Browse Files...
              </button>
            </div>

            {/* Simple Drag & Drop target inside input card */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => folderInputRef.current?.click()}
              className="mt-2.5 border border-dashed border-slate-300 rounded bg-white hover:bg-slate-50 p-3 text-center cursor-pointer transition-colors"
            >
              <p className="text-xs text-slate-500">
                Or drag &amp; drop your <strong className="text-slate-700">input_images</strong> folder directly here
              </p>
              {items.length === 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadSamples();
                  }}
                  className="mt-1.5 text-xs text-indigo-600 hover:underline font-medium"
                >
                  Click here to load 4 test .jpe files
                </button>
              )}
            </div>
          </div>

          {/* 2. Output Folder */}
          <div className="border border-slate-300 rounded p-3 bg-slate-50">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Output Folder
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={outputFolderName}
                onChange={(e) => setOutputFolderName(e.target.value)}
                className="flex-1 bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-slate-500 font-mono"
              />
            </div>
          </div>

          {/* 3. Conversion Options */}
          <div className="border border-slate-300 rounded p-3 bg-slate-50 flex flex-col gap-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Conversion Options
            </label>
            <div className="flex items-center gap-6">
              <span className="text-xs text-slate-600">Target Format:</span>
              <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  checked={targetFormat === 'jpeg'}
                  onChange={() => setTargetFormat('jpeg')}
                />
                <span>JPG</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  checked={targetFormat === 'png'}
                  onChange={() => setTargetFormat('png')}
                />
                <span>PNG</span>
              </label>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={onlyJpe}
                onChange={(e) => setOnlyJpe(e.target.checked)}
              />
              <span>Convert only <code className="bg-slate-200 px-1 rounded text-slate-800">.jpe</code> files (ignore other formats in folder)</span>
            </label>
          </div>

          {/* 4. Action Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleStartConversion}
              disabled={isConverting || filteredItems.length === 0}
              className={`px-5 py-2 text-sm font-semibold rounded shadow-sm transition-colors ${
                filteredItems.length === 0
                  ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                  : isConverting
                  ? 'bg-slate-300 text-slate-600 cursor-wait'
                  : 'bg-slate-800 hover:bg-slate-900 text-white cursor-pointer'
              }`}
            >
              {isConverting ? 'Converting...' : `Convert Images (${filteredItems.length})`}
            </button>

            {completedCount > 0 && (
              <button
                type="button"
                onClick={handleDownloadZip}
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Download {outputFolderName}.zip ({completedCount})
              </button>
            )}

            {items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setItems([]);
                  setProgress(0);
                  setStatusMessage('Cleared. Drop or select a folder.');
                  addLog('Queue cleared.');
                }}
                disabled={isConverting}
                className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 hover:bg-slate-100 rounded transition-colors ml-auto"
              >
                Clear
              </button>
            )}
          </div>

          {/* 5. Progress Bar & Status */}
          <div className="flex flex-col gap-1">
            <div className="w-full bg-slate-200 rounded h-2 overflow-hidden border border-slate-300">
              <div
                className="bg-slate-700 h-full transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-slate-600 font-mono">{statusMessage}</span>
          </div>

          {/* 6. Status Log Box */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Status Log
            </label>
            <div className="bg-slate-900 text-slate-200 font-mono text-xs p-3 rounded h-40 overflow-y-auto leading-relaxed border border-slate-300 select-text">
              {logs.map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap">
                  {line}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-4 py-2 text-xs text-slate-500 flex items-center justify-between">
          <span>imgConvert · Local execution</span>
          <span className="font-mono text-[11px] text-slate-400">100% Client-Side · No uploads</span>
        </div>

      </div>
    </div>
  );
}
