import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TransferFile, PhotoCategory } from '../types';
import {
  X,
  Upload,
  Folder,
  FileText,
  Globe,
  Sparkles,
  Check,
  AlertCircle,
  Tag,
  Layers,
} from 'lucide-react';

export const PublishModal: React.FC = () => {
  const {
    currentUser,
    isPublishModalOpen,
    setIsPublishModalOpen,
    publishPackageAction,
    setAuthModal,
    setActiveTab,
  } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PhotoCategory>('architecture');
  const [tagsInput, setTagsInput] = useState('archive, files, direct-download');
  const [sourceType, setSourceType] = useState<'upload' | 'folder-upload'>('upload');
  const [stagedFiles, setStagedFiles] = useState<TransferFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isPublishModalOpen) return null;

  const handleClose = () => {
    setIsPublishModalOpen(false);
    setError(null);
    setIsSuccess(false);
  };

  // Local file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        setStagedFiles(prev => [
          ...prev,
          {
            id: `pub-up-${Date.now()}-${idx}`,
            name: file.name,
            url,
            size: `${sizeMb} MB`,
            type: file.type || 'application/octet-stream',
            folderPath: 'Public_Uploads',
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Local folder upload handler (webkitdirectory)
  const handleFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const folderName = files[0].webkitRelativePath?.split('/')[0] || 'Published_Folder';
    const loaded: TransferFile[] = [];

    Array.from(files).forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        loaded.push({
          id: `pub-fld-${Date.now()}-${idx}`,
          name: file.name,
          url,
          size: `${sizeMb} MB`,
          type: file.type || 'application/octet-stream',
          folderPath: folderName,
        });

        if (loaded.length === files.length) {
          setStagedFiles(prev => [...prev, ...loaded]);
          if (!title) {
            setTitle(folderName.replace(/[_-]/g, ' '));
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      setAuthModal('signin');
      return;
    }

    if (!title.trim()) {
      setError('Please provide a title for this public bundle');
      return;
    }

    if (stagedFiles.length === 0) {
      setError('Please stage at least one file or folder to publish');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    const res = publishPackageAction({
      title: title.trim(),
      description: description.trim(),
      authorUsername: currentUser.username,
      authorAvatar: '',
      category,
      tags,
      files: stagedFiles,
    });

    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => {
        handleClose();
        setActiveTab('published');
      }, 1200);
    } else {
      setError(res.error || 'Failed to publish package');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto border shadow-2xl rounded-2xl p-6 sm:p-8 bg-[#2b2d31] border-[#383a40] text-white">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl border border-[#383a40] text-neutral-400 hover:bg-[#313338] hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {isSuccess ? (
          <div className="py-12 text-center">
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg"
              style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
            >
              <Check className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-bold font-sans text-white">Files Published Successfully!</h3>
            <p className="mt-2 text-xs font-mono-code text-neutral-400">
              Your bundle is now public in the shared vault for direct download.
            </p>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-2 w-2 rounded-full"
                  style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                />
                <span className="text-[11px] font-mono-code uppercase tracking-wider font-bold text-neutral-400">
                  PUBLIC VAULT DISPATCH
                </span>
              </div>
              <h2 className="mt-1 font-sans text-2xl font-bold tracking-tight text-white">
                Share Files & Folders Publicly
              </h2>
              <p className="mt-1 text-xs text-neutral-400">
                Publish a package or archive to the shared vault so anyone on Noir Archive can download it.
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title & Category */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider font-mono-code mb-1 text-neutral-300">
                    Bundle Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    aria-label="Bundle Title"
                    placeholder="e.g. Design Assets & Fonts"
                    className="w-full rounded-xl border py-2 px-3 text-xs bg-[#1e1f22] border-[#383a40] text-white focus:outline-none focus:border-[var(--color-accent,#5865f2)] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider font-mono-code mb-1 text-neutral-300">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as PhotoCategory)}
                    className="w-full rounded-xl border py-2 px-3 text-xs bg-[#1e1f22] border-[#383a40] text-white focus:outline-none"
                  >
                    <option value="architecture">Design & Assets</option>
                    <option value="street">Documents & Code</option>
                    <option value="nature">Media & Audio</option>
                    <option value="portraiture">Personal Archives</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider font-mono-code mb-1 text-neutral-300">
                  Description / Notes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  aria-label="Description"
                  placeholder="Details about what's inside this bundle..."
                  className="w-full rounded-xl border py-2 px-3 text-xs bg-[#1e1f22] border-[#383a40] text-white focus:outline-none focus:border-[var(--color-accent,#5865f2)] transition-colors resize-none"
                />
              </div>

              {/* Source Mode Tabs */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider font-mono-code mb-2 text-neutral-300">
                  File Upload Source
                </label>
                <div className="grid grid-cols-2 rounded-xl border p-1 font-mono-code text-xs bg-[#1e1f22] border-[#383a40]">
                  <button
                    type="button"
                    onClick={() => setSourceType('upload')}
                    className={`py-1.5 rounded-lg transition-all font-semibold ${
                      sourceType === 'upload'
                        ? 'text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                    style={{
                      backgroundColor: sourceType === 'upload' ? 'var(--color-accent, #5865f2)' : undefined,
                    }}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      Individual Files
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSourceType('folder-upload')}
                    className={`py-1.5 rounded-lg transition-all font-semibold ${
                      sourceType === 'folder-upload'
                        ? 'text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                    style={{
                      backgroundColor: sourceType === 'folder-upload' ? 'var(--color-accent, #5865f2)' : undefined,
                    }}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <Folder className="h-3.5 w-3.5" />
                      Entire Folder
                    </span>
                  </button>
                </div>

                {/* Subpanels for file selection */}
                <div className="mt-3 rounded-xl border p-4 bg-[#232428] border-[#383a40]">
                  {sourceType === 'upload' && (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#383a40] rounded-xl p-6 text-center cursor-pointer hover:border-neutral-400 transition-colors">
                      <Upload className="h-6 w-6 text-neutral-400 mb-2" />
                      <span className="text-xs font-semibold text-white">Select files from your device</span>
                      <span className="text-[11px] font-mono-code mt-1 text-neutral-400">
                        Supports documents, images, zip, audio, code
                      </span>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}

                  {sourceType === 'folder-upload' && (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#383a40] rounded-xl p-6 text-center cursor-pointer hover:border-neutral-400 transition-colors">
                      <Folder className="h-6 w-6 text-neutral-400 mb-2" />
                      <span className="text-xs font-semibold text-white">Select an entire folder from your device</span>
                      <span className="text-[11px] font-mono-code mt-1 text-neutral-400">
                        Preserves folder structure and file hierarchy
                      </span>
                      {/* @ts-ignore */}
                      <input
                        type="file"
                        // @ts-expect-error webkitdirectory is standard in Chromium
                        webkitdirectory=""
                        directory=""
                        multiple
                        onChange={handleFolderUpload}
                        className="hidden"
                      />
                    </label>
                  )}

                  {/* List of staged files */}
                  {stagedFiles.length > 0 && (
                    <div className="mt-3 border-t pt-2 space-y-1 border-[#383a40]">
                      <div className="flex items-center justify-between text-[11px] font-mono-code font-semibold text-neutral-300">
                        <span>{stagedFiles.length} files staged for publishing</span>
                        <span>
                          {stagedFiles.reduce((acc, f) => acc + (parseFloat(f.size) || 1), 0).toFixed(1)} MB
                        </span>
                      </div>
                      <div className="max-h-28 overflow-y-auto space-y-1 pr-1 font-mono-code text-[10px]">
                        {stagedFiles.map((f) => (
                          <div
                            key={f.id}
                            className="flex items-center justify-between py-1 px-2 rounded bg-[#1e1f22] text-neutral-300"
                          >
                            <span className="truncate max-w-[280px]">{f.name}</span>
                            <span>{f.size}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider font-mono-code mb-1 text-neutral-300">
                  Tags (comma separated)
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    aria-label="Tags (comma separated)"
                    placeholder="assets, tools, docs"
                    className="w-full rounded-xl border py-2 pl-9 pr-3 text-xs bg-[#1e1f22] border-[#383a40] text-white focus:outline-none focus:border-[var(--color-accent,#5865f2)] transition-colors"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium rounded-xl text-neutral-400 hover:bg-[#313338] transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
                  style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>Publish to Vault</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
