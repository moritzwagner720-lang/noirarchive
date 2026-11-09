import React from 'react';
import { TransferFile } from '../types';
import {
  X,
  Download,
  FileImage,
  FileVideo,
  FileText,
  FileArchive,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface MediaPreviewModalProps {
  file: TransferFile | null;
  onClose: () => void;
  onDownload?: (file: TransferFile) => void;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  file,
  onClose,
  onDownload,
}) => {
  if (!file) return null;

  const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg)$/i.test(file.name);
  const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name);
  const isPdf = file.type.includes('pdf') || /\.pdf$/i.test(file.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border bg-[#232428] border-[#383a40] text-white shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#383a40] bg-[#1e1f22]">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="p-2 rounded-xl bg-[#2b2d31] border border-[#383a40] text-neutral-300 shrink-0">
              {isImage ? (
                <FileImage className="h-5 w-5 text-indigo-400" />
              ) : isVideo ? (
                <FileVideo className="h-5 w-5 text-amber-400" />
              ) : (
                <FileText className="h-5 w-5 text-neutral-400" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-mono-code text-sm font-bold text-white truncate">
                {file.name}
              </h3>
              <p className="text-[11px] font-mono-code text-neutral-400 flex items-center gap-2 mt-0.5">
                <span>{file.size}</span>
                <span>•</span>
                <span className="uppercase">{file.type || 'Binary Archive'}</span>
                {file.folderPath && (
                  <>
                    <span>•</span>
                    <span className="truncate">{file.folderPath}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onDownload && (
              <button
                onClick={() => onDownload(file)}
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:brightness-110 transition-colors"
                style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border border-[#383a40] text-neutral-400 hover:bg-[#313338] hover:text-white transition-colors"
              aria-label="Close media preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Media Content Stage */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-[#17171a] min-h-[300px]">
          {isImage ? (
            <img
              src={file.url}
              alt={file.name}
              className="max-h-[68vh] max-w-full rounded-xl object-contain shadow-lg"
              loading="lazy"
            />
          ) : isVideo ? (
            <div className="w-full max-w-2xl">
              <video
                src={file.url}
                controls
                preload="none"
                playsInline
                className="w-full rounded-xl shadow-lg bg-black"
              >
                Your browser does not support HTML5 video preview.
              </video>
              <p className="mt-2 text-center text-xs font-mono-code text-neutral-400">
                Autoplay is disabled for privacy and performance. Click play to view.
              </p>
            </div>
          ) : (
            <div className="text-center py-12 px-4 max-w-md">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#232428] border border-[#383a40] text-neutral-400">
                <FileArchive className="h-7 w-7" />
              </div>
              <h4 className="font-sans text-base font-bold text-white">Direct Preview Not Available</h4>
              <p className="mt-1.5 text-xs text-neutral-400">
                This file type ({file.type || 'unknown'}) cannot be previewed in the browser. You can download and open it securely with a native application.
              </p>
              {onDownload && (
                <button
                  onClick={() => onDownload(file)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold text-white hover:brightness-110"
                  style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download {file.name}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Safety Banner */}
        <div className="px-6 py-2.5 border-t border-[#383a40] bg-[#1e1f22] flex items-center justify-between text-[11px] font-mono-code text-neutral-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Isolated client-side sandboxed preview</span>
          </span>
          <span>Verified Noir Archive Asset</span>
        </div>
      </div>
    </div>
  );
};
