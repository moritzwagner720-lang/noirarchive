import React, { useState, useEffect } from 'react';
import { Minus, Square, Copy, X, Monitor, HardDrive, ShieldCheck, Download, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const DesktopTitlebar: React.FC = () => {
  const { theme } = useApp();
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showDesktopGuideModal, setShowDesktopGuideModal] = useState(false);
  const isLight = theme === 'light';

  useEffect(() => {
    if (typeof window !== 'undefined' && window.noirDesktop?.isDesktop) {
      setIsDesktop(true);
      window.noirDesktop.isMaximized().then(setIsMaximized).catch(() => {});
    }
  }, []);

  const handleMinimize = () => {
    window.noirDesktop?.minimize();
  };

  const handleMaximize = () => {
    window.noirDesktop?.maximize();
    window.noirDesktop?.isMaximized().then(setIsMaximized).catch(() => {});
  };

  const handleClose = () => {
    window.noirDesktop?.close();
  };

  // If in desktop app, show native window titlebar with drag region and controls
  if (isDesktop) {
    return (
      <header
        className={`h-9 select-none flex items-center justify-between border-b text-xs font-mono-code transition-colors ${
          isLight
            ? 'bg-slate-100/95 border-slate-200 text-slate-700'
            : 'bg-[#0a0a0f]/95 border-neutral-800 text-neutral-300'
        }`}
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* Left: Icon and Name */}
        <div className="flex items-center gap-2 pl-3">
          <img
            src="/icon.png"
            alt="Noir Archive"
            className="w-4 h-4 rounded border border-neutral-700 object-contain bg-black p-0.5"
          />
          <span className="font-semibold tracking-wide">Noir Archive</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-mono-code border border-blue-500/20">
            Windows Desktop
          </span>
        </div>

        {/* Center: Window Title */}
        <div className="text-[11px] opacity-60 hidden sm:block">
          Minimalist Photography Portfolios & File Delivery
        </div>

        {/* Right: Window Control Buttons (no-drag) */}
        <div
          className="flex items-center h-full"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={handleMinimize}
            className={`w-11 h-full flex items-center justify-center transition-colors ${
              isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMaximize}
            className={`w-11 h-full flex items-center justify-center transition-colors ${
              isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
          </button>
          <button
            onClick={handleClose}
            className="w-11 h-full flex items-center justify-center transition-colors hover:bg-red-600 hover:text-white text-neutral-400"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>
    );
  }

  // If in browser preview, show a discrete top bar with Windows Desktop App info
  return (
    <>
      <div
        className={`px-3 py-1.5 border-b text-[11px] font-mono-code flex items-center justify-between transition-colors ${
          isLight
            ? 'bg-blue-50/70 border-blue-100 text-blue-900'
            : 'bg-[#0f1118] border-blue-950/60 text-blue-300'
        }`}
      >
        <div className="flex items-center gap-2">
          <Monitor className="w-3.5 h-3.5 text-blue-500" />
          <span>
            <strong className="font-semibold text-white">Windows Desktop App Ready:</strong> Electron + NSIS Setup.exe installer configured.
          </span>
        </div>
        <button
          onClick={() => setShowDesktopGuideModal(true)}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
            isLight
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-blue-600/90 text-white hover:bg-blue-500'
          }`}
        >
          <HardDrive className="w-3 h-3" />
          <span>Windows Installer Guide</span>
        </button>
      </div>

      {/* Windows Desktop Modal */}
      {showDesktopGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-2xl rounded-xl border p-6 shadow-2xl transition-all ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0e0e14] border-neutral-800 text-white'
            }`}
          >
            <div className="flex items-start justify-between border-b pb-4 mb-4 border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-neutral-700 shadow bg-black p-1 flex items-center justify-center">
                  <img
                    src="/icon.png"
                    alt="Noir Archive"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Noir Archive for Windows</h3>
                  <p className="text-xs text-neutral-400">
                    Standalone Desktop Application with NSIS Installer & Setup.exe
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDesktopGuideModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono-code">
              <div className="p-3 rounded-lg bg-neutral-900/80 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-[13px]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Configured Features</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-neutral-300">
                  <li><strong>Native Standalone App:</strong> Embedded local server storing data in Windows <code className="text-blue-400">%APPDATA%/Noir Archive</code>.</li>
                  <li><strong>Clean Window:</strong> Browser URL bars, dev menus, and chromium chrome stripped out.</li>
                  <li><strong>Custom Icon:</strong> High-resolution multi-size Windows <code className="text-blue-400">icon.ico</code> and <code className="text-blue-400">icon.png</code>.</li>
                  <li><strong>NSIS Installer:</strong> Generates <code className="text-green-400">Setup.exe</code> with automatic Desktop & Start Menu shortcuts.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-neutral-200 mb-2">How to build Setup.exe locally on Windows:</h4>
                <div className="p-3 rounded-lg bg-black/90 border border-neutral-800 text-neutral-300 space-y-2">
                  <p className="text-neutral-400"># 1. Install dependencies (on your Windows machine):</p>
                  <p className="text-green-400 select-all">npm install</p>
                  <p className="text-neutral-400"># 2. Build the Windows NSIS Installer (generates Setup.exe):</p>
                  <p className="text-green-400 select-all">npm run build:win</p>
                  <p className="text-neutral-400"># Output installer file will be located at:</p>
                  <p className="text-blue-400 font-semibold select-all">dist-electron/Setup.exe</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-neutral-500">
                  Batch script <code className="text-neutral-400">build-windows-installer.bat</code> is included in the root folder.
                </span>
                <button
                  onClick={() => setShowDesktopGuideModal(false)}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
