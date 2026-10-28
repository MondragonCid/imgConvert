import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { ImageFileItem, ConversionSettings } from './types';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { ConversionControls } from './components/ConversionControls';
import { ImageList } from './components/ImageList';
import { ComparisonModal } from './components/ComparisonModal';
import { CliCompanionModal } from './components/CliCompanionModal';
import { processFilesToItems, getImageDimensions, formatBytes } from './utils/fileScanner';
import { convertSingleImage } from './utils/imageConverter';
import { exportConvertedAsZip, triggerDownload } from './utils/zipExporter';
import { createSampleJpeFiles } from './utils/sampleImages';
import { Sparkles, CheckCheck, FolderArchive, ArrowDownToLine } from 'lucide-react';

export default function App() {
  const [items, setItems] = useState<ImageFileItem[]>([]);
  const [settings, setSettings] = useState<ConversionSettings>({
    targetFormat: 'jpeg',
    quality: 0.92,
    matteColor: '#FFFFFF',
    onlyJpeFiles: false,
    preserveFolderStructure: true,
    prefix: '',
    suffix: '',
  });

  const [isConverting, setIsConverting] = useState(false);
  const [activeComparisonItem, setActiveComparisonItem] = useState<ImageFileItem | null>(null);
  const [isCliModalOpen, setIsCliModalOpen] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipStatusText, setZipStatusText] = useState('');

  // Handle addition of raw files (from dropped folder, folder picker, or file picker)
  const handleFilesSelected = useCallback(async (newFiles: File[]) => {
    const newItems = await processFilesToItems(newFiles, false);
    
    // Add to items list (avoiding duplicate ids)
    setItems((prev) => {
      const existingNames = new Set(prev.map((i) => `${i.name}_${i.originalSize}`));
      const uniqueNew = newItems.filter((i) => !existingNames.has(`${i.name}_${i.originalSize}`));
      return [...prev, ...uniqueNew];
    });

    // Background dimension resolution
    newItems.forEach(async (item) => {
      const dims = await getImageDimensions(item.file);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, width: dims.width, height: dims.height } : i))
      );
    });
  }, []);

  // Quick load of sample .jpe files
  const handleLoadSamples = useCallback(async () => {
    try {
      const sampleFiles = await createSampleJpeFiles();
      await handleFilesSelected(sampleFiles);
    } catch (err) {
      console.error('Failed to load sample images:', err);
    }
  }, [handleFilesSelected]);

  // Counts & stats
  const jpeOnlyCount = useMemo(() => {
    return items.filter((i) => i.name.toLowerCase().endsWith('.jpe')).length;
  }, [items]);

  const activeItems = useMemo(() => {
    return settings.onlyJpeFiles
      ? items.filter((i) => i.name.toLowerCase().endsWith('.jpe'))
      : items;
  }, [items, settings.onlyJpeFiles]);

  const completedCount = useMemo(() => {
    return activeItems.filter((i) => i.status === 'completed').length;
  }, [activeItems]);

  const progressPercent = useMemo(() => {
    if (activeItems.length === 0) return 0;
    return Math.round((completedCount / activeItems.length) * 100);
  }, [completedCount, activeItems.length]);

  // Overall statistics for converted files
  const conversionStats = useMemo(() => {
    const completed = activeItems.filter((i) => i.status === 'completed' && i.outputSize);
    const origBytes = completed.reduce((acc, i) => acc + i.originalSize, 0);
    const outBytes = completed.reduce((acc, i) => acc + (i.outputSize || 0), 0);
    const savedBytes = origBytes - outBytes;
    return {
      completedCount: completed.length,
      origBytes,
      outBytes,
      savedBytes,
    };
  }, [activeItems]);

  // Remove single item
  const handleRemoveItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Reset queue
  const handleClear = useCallback(() => {
    setItems([]);
  }, []);

  // Batch Conversion Engine
  const handleStartConversion = async () => {
    if (activeItems.length === 0 || isConverting) return;

    setIsConverting(true);

    // Reset status of active items to pending if re-running
    setItems((prev) =>
      prev.map((item) => {
        const matchesFilter = !settings.onlyJpeFiles || item.name.toLowerCase().endsWith('.jpe');
        if (matchesFilter) {
          return { ...item, status: 'pending', errorMessage: undefined };
        }
        return item;
      })
    );

    const itemsToProcess = [...activeItems];
    let successCount = 0;

    for (let i = 0; i < itemsToProcess.length; i++) {
      const currentItem = itemsToProcess[i];

      // Mark current as processing
      setItems((prev) =>
        prev.map((item) => (item.id === currentItem.id ? { ...item, status: 'processing' } : item))
      );

      try {
        const result = await convertSingleImage(currentItem, settings);
        successCount++;

        // Update item with result
        setItems((prev) =>
          prev.map((item) =>
            item.id === currentItem.id
              ? {
                  ...item,
                  status: 'completed',
                  outputBlob: result.blob,
                  outputUrl: result.url,
                  outputSize: result.size,
                  outputName: result.outputName,
                  outputFormat: settings.targetFormat,
                  width: result.width,
                  height: result.height,
                  convertedAt: Date.now(),
                }
              : item
          )
        );
      } catch (err: any) {
        console.error(`Error converting ${currentItem.name}:`, err);
        setItems((prev) =>
          prev.map((item) =>
            item.id === currentItem.id
              ? {
                  ...item,
                  status: 'error',
                  errorMessage: err?.message || 'Conversion failed',
                }
              : item
          )
        );
      }
    }

    setIsConverting(false);

    // Trigger celebratory confetti if any converted
    if (successCount > 0) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#6366f1', '#38bdf8', '#10b981'],
        });
      } catch {
        // Safe fallback
      }
    }
  };

  // Download all as ZIP (mimics the converted/ output folder)
  const handleDownloadZip = async () => {
    const completedItems = activeItems.filter((i) => i.status === 'completed' && i.outputBlob);
    if (completedItems.length === 0) return;

    setIsZipping(true);
    setZipStatusText('Preparing ZIP archive...');

    try {
      const zipBlob = await exportConvertedAsZip(completedItems, (pct, status) => {
        setZipStatusText(`${status} (${pct}%)`);
      });

      triggerDownload(zipBlob, `converted_${settings.targetFormat}.zip`);
    } catch (err) {
      console.error('ZIP generation failed:', err);
    } finally {
      setIsZipping(false);
      setZipStatusText('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* 3-Zone Navigation Header */}
      <Header
        onOpenCliModal={() => setIsCliModalOpen(true)}
        onLoadSamples={handleLoadSamples}
        totalCount={activeItems.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        
        {/* Hero Banner / Introductory Context */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-900">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Batch Image &amp; JPE Converter
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Drop an entire folder of <span className="text-indigo-300 font-mono">.jpe</span> or standard images, select target format, and convert in one click.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg font-mono">
              Zero-upload · 100% Client-Side Canvas
            </span>
          </div>
        </div>

        {/* 1. Drop Zone */}
        <DropZone
          onFilesSelected={handleFilesSelected}
          onLoadSamples={handleLoadSamples}
          isProcessing={isConverting}
          totalLoaded={items.length}
        />

        {/* 2. Conversion Settings & Start Bar */}
        <ConversionControls
          settings={settings}
          onSettingsChange={setSettings}
          onStartConversion={handleStartConversion}
          onDownloadZip={handleDownloadZip}
          onClear={handleClear}
          isConverting={isConverting}
          progressPercent={progressPercent}
          totalCount={items.length}
          completedCount={completedCount}
          jpeOnlyCount={jpeOnlyCount}
        />

        {/* 3. Conversion Summary Strip (if items completed) */}
        {completedCount > 0 && (
          <div className="w-full bg-emerald-950/20 border border-emerald-800/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCheck className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-emerald-300">
                  Batch Conversion Complete: {completedCount} of {activeItems.length} files converted
                </span>
                <span className="text-slate-400 font-mono">
                  Original: {formatBytes(conversionStats.origBytes)} &rarr; Output: {formatBytes(conversionStats.outBytes)}
                  {conversionStats.savedBytes > 0 && (
                    <span className="text-emerald-400 ml-1.5">
                      (Saved {formatBytes(conversionStats.savedBytes)})
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={isZipping}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg shadow-sm transition-all flex items-center gap-2 whitespace-nowrap"
              >
                {isZipping ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{zipStatusText || 'Creating ZIP...'}</span>
                  </>
                ) : (
                  <>
                    <FolderArchive className="w-3.5 h-3.5" />
                    <span>Download converted.zip</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 4. Batch Queue & Image List */}
        <section id="queue" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">Conversion Queue</h2>
              <span className="text-xs font-mono text-slate-500">
                ({activeItems.length} {activeItems.length === 1 ? 'file' : 'files'})
              </span>
            </div>

            {completedCount > 0 && (
              <span className="text-xs text-slate-400">
                Click <span className="text-indigo-300">eye icon</span> to compare before/after
              </span>
            )}
          </div>

          <ImageList
            items={items}
            onlyJpeFiles={settings.onlyJpeFiles}
            onRemoveItem={handleRemoveItem}
            onCompareItem={(item) => setActiveComparisonItem(item)}
            targetFormat={settings.targetFormat}
          />
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            imgConvert &bull; Drop folder &amp; batch image conversion engine
          </p>
          <p className="font-mono text-slate-600 text-[11px]">
            Input: <code className="text-slate-400">input_images/</code> &bull; Output: <code className="text-slate-400">converted/</code>
          </p>
        </div>
      </footer>

      {/* Comparison Modal (Side-by-side / split slider) */}
      <ComparisonModal
        item={activeComparisonItem}
        onClose={() => setActiveComparisonItem(null)}
      />

      {/* Python CLI companion modal */}
      <CliCompanionModal
        isOpen={isCliModalOpen}
        onClose={() => setIsCliModalOpen(false)}
      />
    </div>
  );
}
