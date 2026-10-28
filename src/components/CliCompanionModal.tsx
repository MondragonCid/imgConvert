import React, { useState } from 'react';
import { X, Copy, Check, Terminal, FolderTree, Download, Sparkles, Box } from 'lucide-react';
import { triggerDownload } from '../utils/zipExporter';

interface CliCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CliCompanionModal: React.FC<CliCompanionModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'exe_instructions' | 'gui_script' | 'cli_original'>('exe_instructions');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const pyinstallerCommand = `pip install pyinstaller pillow
pyinstaller --noconsole --onefile --name "imgConvert" gui_app.py`;

  const downloadGuiScript = async () => {
    try {
      const res = await fetch('/gui_app.py');
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/x-python' });
      triggerDownload(blob, 'gui_app.py');
    } catch {
      // Fallback
      alert('Could not download file. You can copy the code from the GUI Script tab.');
    }
  };

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(pyinstallerCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <Box className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-white">
              Windows Executable (.exe) &amp; Python Visual Studio Guide
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800 bg-slate-950/20 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('exe_instructions')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'exe_instructions'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            How to Build the .exe
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gui_script')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'gui_script'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            gui_app.py (Visual Studio GUI Code)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-300">
          
          {activeTab === 'exe_instructions' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-800/40">
                <h4 className="font-semibold text-indigo-300 mb-1 flex items-center gap-1.5 text-sm">
                  <Sparkles className="w-4 h-4" /> Ready for Visual Studio / VS Code
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  We created a complete desktop GUI version called <code className="text-white font-mono">gui_app.py</code> using Python&apos;s standard <code className="text-white font-mono">tkinter</code> and your existing <code className="text-white font-mono">Pillow</code> library. It has folder pickers, progress bars, and runs 100% locally on your computer with zero web dependencies.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  3 Simple Steps in Visual Studio:
                </h4>
                <ol className="space-y-3 text-xs text-slate-300 list-decimal list-inside">
                  <li className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <strong className="text-white">Save the file:</strong> Put <code className="text-indigo-300 font-mono">gui_app.py</code> inside your <code className="text-indigo-300 font-mono">imgConvert</code> folder.
                  </li>
                  <li className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <strong className="text-white">Install PyInstaller &amp; Pillow:</strong> In your Visual Studio Terminal run:
                    <pre className="mt-2 p-2 rounded bg-slate-900 font-mono text-emerald-400 text-[11px]">
                      pip install pyinstaller pillow
                    </pre>
                  </li>
                  <li className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <strong className="text-white">Generate the .exe:</strong> Run this command:
                    <div className="flex items-center justify-between mt-2 p-2 rounded bg-slate-900 font-mono text-indigo-300 text-[11px]">
                      <code>pyinstaller --noconsole --onefile --name &quot;imgConvert&quot; gui_app.py</code>
                      <button
                        type="button"
                        onClick={handleCopyCmd}
                        className="px-2 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors"
                      >
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="text-xs text-slate-400 p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-emerald-400 font-medium">Result:</span> Your single-file executable will be in the <code className="text-white font-mono">dist/imgConvert.exe</code> folder! You can move <code className="text-white font-mono">imgConvert.exe</code> anywhere, double-click it, and it will open your desktop app without needing any terminal.
              </div>
            </div>
          )}

          {activeTab === 'gui_script' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Save this as <code className="text-indigo-300 font-mono">gui_app.py</code> in Visual Studio:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={downloadGuiScript}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download gui_app.py
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 max-h-72 overflow-y-auto leading-relaxed">
                <p className="text-slate-500"># gui_app.py has been generated and saved directly in your project root.</p>
                <p className="text-slate-500"># Click &apos;Download gui_app.py&apos; above or copy the code from your project files.</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/40">
          <button
            type="button"
            onClick={downloadGuiScript}
            className="px-3 py-1.5 text-xs font-medium text-indigo-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Download gui_app.py
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
