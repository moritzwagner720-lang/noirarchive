import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PublishedPackage, TransferFile } from '../types';
import { filterPublishedPackages } from '../utils/published';
import { UserAvatar } from './UserAvatar';
import {
  Download,
  Heart,
  FileArchive,
  Eye,
  Search,
  Sparkles,
  Layers,
  Upload,
  Folder,
  Check,
  X,
  Share2,
  ExternalLink,
  Tag,
  FileText,
} from 'lucide-react';
import JSZip from 'jszip';

export const PublishedFilesSection: React.FC = () => {
  const {
    publishedPackages,
    recordPublishedDownload,
    togglePublishedLikeAction,
    setIsPublishModalOpen,
    currentUser,
    setAuthModal,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'downloads' | 'likes'>('latest');
  const [inspectingPackage, setInspectingPackage] = useState<PublishedPackage | null>(null);
  const [downloadingZipId, setDownloadingZipId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Filter & sort
  const displayed = filterPublishedPackages(
    publishedPackages,
    searchQuery,
    activeCategory,
    sortBy
  );

  // JSZip download package
  const handleDownloadZip = async (pkg: PublishedPackage) => {
    try {
      setDownloadingZipId(pkg.id);
      recordPublishedDownload(pkg.id);

      const zip = new JSZip();
      const folderName = pkg.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      const folder = zip.folder(folderName) || zip;

      for (const file of pkg.files) {
        try {
          if (file.url.startsWith('data:')) {
            const base64Data = file.url.split(',')[1];
            folder.file(file.name, base64Data, { base64: true });
          } else {
            const res = await fetch(file.url);
            const blob = await res.blob();
            folder.file(file.name, blob);
          }
        } catch {
          folder.file(
            file.name.replace(/\.\w+$/, '.txt'),
            `Published Archive File: ${file.name}\nSource: ${file.url}\nPublisher: @${pkg.authorUsername}`
          );
        }
      }

      // Manifest file
      folder.file(
        'README_MANIFEST.txt',
        `NOIR ARCHIVE PUBLIC DELIVERY\nTitle: ${pkg.title}\nPublished by: @${pkg.authorUsername}\nDescription: ${pkg.description}\nAssets: ${pkg.files.length}\nDate: ${pkg.createdAt}\nFree Direct Download.\n`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('ZIP failed', err);
      alert('Could not package ZIP. You can preview and download individual files directly.');
    } finally {
      setDownloadingZipId(null);
    }
  };

  const handleDownloadSingleFile = (file: TransferFile, pkgId: string) => {
    recordPublishedDownload(pkgId);
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyShareLink = (pkgId: string) => {
    const url = `${window.location.origin}${window.location.pathname}?published=${pkgId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const categories = [
    { id: 'all', label: 'All Files & Folders' },
    { id: 'bundles', label: 'Bundles & Archives' },
    { id: 'architecture', label: 'Design & Assets' },
    { id: 'street', label: 'Documents & Media' },
  ];

  return (
    <div className="py-8">
      {/* Header bar */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b pb-6 border-[#383a40]">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="flex h-2 w-2 rounded-full"
              style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
            />
            <span className="text-[11px] font-mono-code font-bold uppercase tracking-wider text-neutral-400">
              SHARED COMMUNITY VAULT
            </span>
          </div>
          <h1 className="mt-1 font-sans text-3xl font-extrabold tracking-tight text-white">
            Shared Files & Public Archives
          </h1>
          <p className="mt-1 text-xs max-w-xl text-neutral-400">
            Explore public packages and folders shared by the Noir Archive community. Freely inspect, preview, and download full archives or individual files.
          </p>
        </div>

        {/* Publish Action */}
        <button
          onClick={() => {
            if (!currentUser) {
              setAuthModal('signin');
            } else {
              setIsPublishModalOpen(true);
            }
          }}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-[0.98] transition-all shrink-0"
          style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
        >
          <Upload className="h-4 w-4 stroke-[2.5]" />
          <span>Share to Public Vault</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Category filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'bg-[#2b2d31] text-neutral-300 hover:text-white border border-[#383a40]'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--color-accent, #5865f2)' : undefined,
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search input and sort */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Search shared files"
              placeholder="Filter archives..."
              className="w-52 sm:w-64 rounded-xl border py-1.5 pl-8 pr-3 text-xs bg-[#2b2d31] border-[#383a40] text-white placeholder:text-neutral-500 focus:outline-none focus:border-[var(--color-accent,#5865f2)] transition-colors"
            />
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="rounded-xl border py-1.5 px-3 text-xs font-mono-code bg-[#2b2d31] border-[#383a40] text-neutral-200 focus:outline-none"
          >
            <option value="latest">Latest</option>
            <option value="downloads">Most Downloaded</option>
            <option value="likes">Most Liked</option>
          </select>
        </div>
      </div>

      {/* Grid of Published Packages */}
      {publishedPackages.length === 0 ? (
        <div className="py-20 px-6 text-center border-2 border-dashed rounded-2xl border-[#383a40] bg-[#2b2d31]/40 text-white">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white"
            style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
          >
            <Upload className="h-6 w-6 stroke-[2.5]" />
          </div>
          <h3 className="text-lg font-bold font-sans">No Public Collections Yet</h3>
          <p className="mt-2 text-xs max-w-md mx-auto text-neutral-400">
            Publish your files, bundles, or curated asset archives to share them with the open community for direct download.
          </p>
          <button
            onClick={() => {
              if (!currentUser) {
                setAuthModal('signin');
              } else {
                setIsPublishModalOpen(true);
              }
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 font-sans text-xs font-bold text-white shadow-md hover:brightness-110 transition-all hover:scale-105"
            style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
          >
            <Upload className="h-4 w-4 stroke-[2.5]" />
            <span>Publish Your First Package</span>
          </button>
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed rounded-2xl border-[#383a40] bg-[#2b2d31]/30">
          <Layers className="mx-auto mb-3 h-10 w-10 text-neutral-500" />
          <h3 className="text-base font-bold font-sans text-white">No matching packages</h3>
          <p className="mt-1 text-xs font-mono-code text-neutral-400">
            Try clearing filters or search queries.
          </p>
          <button
            onClick={() => {
              setActiveCategory('all');
              setSearchQuery('');
            }}
            className="mt-4 text-xs font-bold text-indigo-400 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayed.map(pkg => {
            const isDownloading = downloadingZipId === pkg.id;
            const hasLiked = currentUser && pkg.likedBy?.includes(currentUser.username);

            return (
              <div
                key={pkg.id}
                className="group rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 bg-[#2b2d31] border-[#383a40] hover:border-[#4e5058]"
              >
                <div>
                  {/* Clean Package Banner Header */}
                  <div
                    onClick={() => setInspectingPackage(pkg)}
                    className="relative h-32 w-full overflow-hidden bg-[#232428] cursor-pointer flex flex-col justify-between p-4 border-b border-[#383a40]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-black/50 backdrop-blur-md px-2.5 py-1 font-mono-code text-[10px] uppercase font-bold text-neutral-200 border border-white/10">
                        {pkg.category}
                      </span>
                      <span className="font-mono-code text-[10px] text-neutral-400">
                        {pkg.id}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-white font-mono-code text-[11px]">
                      <span className="flex items-center gap-1.5 text-neutral-300">
                        <Folder className="h-4 w-4" style={{ color: 'var(--color-accent, #5865f2)' }} />
                        {pkg.files.length} {pkg.files.length === 1 ? 'file' : 'files'}
                      </span>
                      <span className="text-neutral-400">{pkg.totalSize}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    {/* Author handle with letter avatar */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <UserAvatar username={pkg.authorUsername} size="sm" />
                        <span className="font-mono-code text-xs font-bold text-white">
                          @{pkg.authorUsername}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono-code text-neutral-400">
                        <span>{pkg.downloadsCount} downloads</span>
                      </div>
                    </div>

                    <h3
                      onClick={() => setInspectingPackage(pkg)}
                      className="text-base font-bold font-sans text-white cursor-pointer hover:underline transition-colors line-clamp-1"
                    >
                      {pkg.title}
                    </h3>

                    <p className="mt-1.5 text-xs line-clamp-2 leading-relaxed text-neutral-400">
                      {pkg.description}
                    </p>

                    {/* Tags */}
                    {pkg.tags && pkg.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1 font-mono-code text-[10px]">
                        {pkg.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md bg-[#232428] border border-[#383a40] text-neutral-300"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 border-t flex items-center justify-between gap-2 border-[#383a40] bg-[#232428]">
                  {/* Like button */}
                  <button
                    onClick={() => togglePublishedLikeAction(pkg.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono-code transition-colors ${
                      hasLiked
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'text-neutral-400 hover:text-rose-400 hover:bg-[#313338]'
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${hasLiked ? 'fill-current text-rose-500' : ''}`} />
                    <span>{pkg.likesCount}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Inspect files button */}
                    <button
                      onClick={() => setInspectingPackage(pkg)}
                      title="Inspect files inside this bundle"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono-code border transition-colors border-[#383a40] text-neutral-200 hover:bg-[#313338]"
                    >
                      <Eye className="h-3 w-3 text-neutral-400" />
                      <span>Files</span>
                    </button>

                    {/* Download Full ZIP */}
                    <button
                      onClick={() => handleDownloadZip(pkg)}
                      disabled={isDownloading}
                      className="flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                      style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                    >
                      <Download className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>{isDownloading ? 'Packing...' : 'Download'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Package Inspector Modal */}
      {inspectingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border p-6 sm:p-8 shadow-2xl bg-[#2b2d31] border-[#383a40] text-white">
            <button
              onClick={() => setInspectingPackage(null)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl border border-[#383a40] text-neutral-400 hover:bg-[#313338] hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <span className="font-mono-code text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  {inspectingPackage.id} • {inspectingPackage.category}
                </span>
              </div>
              <h2 className="mt-1 font-sans text-2xl font-bold text-white">
                {inspectingPackage.title}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-3 font-mono-code text-xs text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <UserAvatar username={inspectingPackage.authorUsername} size="xs" />
                  <span>Published by <strong>@{inspectingPackage.authorUsername}</strong></span>
                </span>
                <span>•</span>
                <span>{inspectingPackage.files.length} Files</span>
                <span>•</span>
                <span>{inspectingPackage.totalSize}</span>
                <span>•</span>
                <span>{inspectingPackage.downloadsCount} downloads</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-neutral-400">
                {inspectingPackage.description}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleDownloadZip(inspectingPackage)}
                disabled={downloadingZipId === inspectingPackage.id}
                className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 transition-all disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
              >
                <FileArchive className="h-4 w-4" />
                <span>
                  {downloadingZipId === inspectingPackage.id
                    ? 'Packaging ZIP Archive...'
                    : `Download Entire Bundle (.ZIP)`}
                </span>
              </button>

              <button
                onClick={() => copyShareLink(inspectingPackage.id)}
                className="flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-mono-code border-[#383a40] text-neutral-300 hover:bg-[#313338] transition-colors"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
                <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
              </button>
            </div>

            {/* Files List */}
            <div className="border-t pt-4 border-[#383a40]">
              <h4 className="text-xs font-mono-code uppercase font-semibold mb-3 text-neutral-300">
                Included Files ({inspectingPackage.files.length})
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {inspectingPackage.files.map(file => (
                  <div
                    key={file.id}
                    className="rounded-xl border p-3 flex items-center justify-between gap-3 border-[#383a40] bg-[#232428]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-[#313338] flex items-center justify-center shrink-0 text-neutral-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate font-mono-code text-white">{file.name}</p>
                        <p className="text-[10px] font-mono-code text-neutral-400 mt-0.5">{file.size}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownloadSingleFile(file, inspectingPackage.id)}
                      className="flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-medium shrink-0 border-[#383a40] bg-[#2b2d31] text-neutral-200 hover:border-neutral-400 transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
