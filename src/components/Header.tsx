import React from 'react';
import { Layers, FolderOpen, Code2 } from 'lucide-react';

interface HeaderProps {
  onOpenCliModal: () => void;
  onLoadSamples: () => void;
  totalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCliModal,
  onLoadSamples,
  totalCount,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
          <Layers className="w-4 h-4" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white">imgConvert</span>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        <a href="#dropzone" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
          Input Folder
        </a>
        <a href="#queue" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
          Batch Queue {totalCount > 0 && <span className="text-slate-400 font-mono text-xs">({totalCount})</span>}
        </a>
        <a href="#settings" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
          Format Settings
        </a>
        <button
          onClick={onOpenCliModal}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 text-slate-400 hover:text-slate-200"
        >
          <Code2 className="w-3.5 h-3.5" />
          Python CLI Sync
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onLoadSamples}
          className="px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          title="Load 4 sample .jpe test images"
        >
          <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
          Load Sample .JPEs
        </button>
      </div>
    </header>
  );
};
