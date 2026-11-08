import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PublishedPackage, TransferFile } from '../types';
import { filterPublishedPackages } from '../utils/published';
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
    theme,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'downloads' | 'likes'>('latest');
  const [inspectingPackage, setInspectingPackage] = useState<PublishedPackage | null>(null);
  const [downloadingZipId, setDownloadingZipId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const isLight = theme === 'light';

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
        `NOIR ARCHIVE PUBLIC DELIVERY\nTitle: ${pkg.title}\nPublished by: @${pkg.authorUsername}\nDescription: ${pkg.description}\nAssets: ${pkg.files.length}\nDate: ${pkg.createdAt}\nFree Public Download.\n`
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
    { id: 'all', label: 'All Files' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'street', label: 'Street & Documentary' },
    { id: 'portraiture', label: 'Portraiture' },
    { id: 'nature', label: 'Nature' },
    { id: 'bundles', label: 'Curated Bundles' },
  ];

  return (
    <div className="py-8">
      {/* Header bar */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b pb-6 transition-colors border-orange-500/15">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#ff6b00] shadow-sm shadow-orange-500/50" />
            <span className="text-[11px] font-mono-code font-bold uppercase tracking-wider text-[#ff6b00]">
              OPEN NOCTURNAL VAULT
            </span>
          </div>
          <h1 className="mt-1 font-sans text-3xl font-extrabold tracking-tight">
            Published Files & Community Downloads
          </h1>
          <p className={`mt-1 text-xs max-w-xl ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
            Explore collections and folders published by creators. Anyone can freely inspect, preview, and download full bundles or individual assets.
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
          className="flex items-center gap-2 rounded-lg bg-[#ff6b00] px-5 py-2.5 text-xs font-bold text-black shadow-md shadow-orange-950/40 hover:bg-[#ff7d1f] hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
        >
          <Upload className="h-4 w-4 stroke-[2.5]" />
          <span>Publish Your Files</span>
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
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#ff6b00] text-black shadow-sm'
                    : isLight
                    ? 'bg-amber-100/70 text-stone-700 hover:bg-amber-200'
                    : 'bg-[#180e0a] text-neutral-300 hover:text-white border border-orange-500/20'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search input and sort */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-orange-400/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Search published files"
              placeholder="Filter archives..."
              className={`w-52 sm:w-64 rounded-lg border py-1.5 pl-8 pr-3 text-xs focus:border-[#ff6b00] focus:outline-none transition-colors ${
                isLight
                  ? 'bg-white border-amber-300 text-stone-900'
                  : 'bg-[#160d09] border-orange-500/30 text-white placeholder:text-neutral-500'
              }`}
            />
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className={`rounded-lg border py-1.5 px-3 text-xs font-mono-code focus:outline-none transition-colors ${
              isLight
                ? 'bg-white border-amber-300 text-stone-700'
                : 'bg-[#160d09] border-orange-500/30 text-orange-200'
            }`}
          >
            <option value="latest">Latest</option>
            <option value="downloads">Most Downloaded</option>
            <option value="likes">Most Liked</option>
          </select>
        </div>
      </div>

      {/* Grid of Published Packages */}
      {publishedPackages.length === 0 ? (
        <div
          className={`py-20 px-6 text-center border-2 border-dashed rounded-2xl ${
            isLight ? 'border-amber-300 bg-amber-50/50' : 'border-orange-500/30 bg-[#130b08]/60'
          }`}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/10 text-[#ff6b00] border border-orange-500/30">
            <Upload className="h-6 w-6 stroke-[2.5]" />
          </div>
          <h3 className="text-lg font-bold font-sans">No Published Collections Yet</h3>
          <p className={`mt-2 text-xs max-w-md mx-auto ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
            All placeholder items have been removed. Publish your photographs, archives, or curated series to share them with the open community for direct download.
          </p>
          <button
            onClick={() => {
              if (!currentUser) {
                setAuthModal('signin');
              } else {
                setIsPublishModalOpen(true);
              }
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#ff6b00] px-6 py-2.5 font-sans text-xs font-bold text-black shadow-md shadow-orange-950/40 hover:bg-[#ff7d1f] transition-all hover:scale-105"
          >
            <Upload className="h-4 w-4 stroke-[2.5]" />
            <span>Publish Your First File Collection</span>
          </button>
        </div>
      ) : displayed.length === 0 ? (
        <div
          className={`py-16 text-center border-2 border-dashed rounded-2xl ${
            isLight ? 'border-amber-200 bg-amber-50/40' : 'border-orange-500/20 bg-[#130b08]/40'
          }`}
        >
          <Layers className="mx-auto mb-3 h-10 w-10 text-orange-400/60" />
          <h3 className="text-base font-bold font-sans">No matching published packages</h3>
          <p className={`mt-1 text-xs font-mono-code ${isLight ? 'text-stone-500' : 'text-neutral-400'}`}>
            Try clearing filters or search queries.
          </p>
          <button
            onClick={() => {
              setActiveCategory('all');
              setSearchQuery('');
            }}
            className="mt-4 text-xs font-bold text-[#ff6b00] hover:underline"
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
                className={`group rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 ${
                  isLight
                    ? 'bg-white border-amber-200 hover:border-amber-300'
                    : 'bg-[#140b07] border-orange-500/25 hover:border-orange-500/50 shadow-[0_10px_30px_-10px_rgba(255,107,0,0.1)]'
                }`}
              >
                <div>
                  {/* Cover preview */}
                  <div
                    onClick={() => setInspectingPackage(pkg)}
                    className="relative aspect-[16/10] w-full overflow-hidden bg-black cursor-pointer"
                  >
                    <img
                      src={pkg.coverUrl}
                      alt={pkg.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                    <div className="absolute top-3 left-3">
                      <span className="rounded-md bg-black/80 backdrop-blur-md px-2.5 py-1 font-mono-code text-[10px] uppercase font-bold text-orange-300 border border-orange-500/30">
                        {pkg.category}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white font-mono-code text-[11px]">
                      <span className="flex items-center gap-1 text-orange-200">
                        <Folder className="h-3.5 w-3.5 text-[#ff6b00]" />
                        {pkg.files.length} {pkg.files.length === 1 ? 'file' : 'files'}
                      </span>
                      <span className="text-orange-200/80">{pkg.totalSize}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    {/* Author handle */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={pkg.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                          alt={pkg.authorUsername}
                          className="h-5 w-5 rounded-full object-cover ring-1 ring-orange-500/50"
                        />
                        <span className="font-mono-code text-xs font-bold text-[#ff6b00]">
                          @{pkg.authorUsername}
                        </span>
                      </div>

                      <div className={`flex items-center gap-3 text-xs font-mono-code ${isLight ? 'text-stone-500' : 'opacity-75 text-orange-200/80'}`}>
                        <span>{pkg.downloadsCount} downloads</span>
                      </div>
                    </div>

                    <h3
                      onClick={() => setInspectingPackage(pkg)}
                      className="text-base font-bold font-sans cursor-pointer hover:text-[#ff6b00] transition-colors line-clamp-1"
                    >
                      {pkg.title}
                    </h3>

                    <p className={`mt-1.5 text-xs line-clamp-2 leading-relaxed ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
                      {pkg.description}
                    </p>

                    {/* Tags */}
                    {pkg.tags && pkg.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1 font-mono-code text-[10px]">
                        {pkg.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className={`px-2 py-0.5 rounded-md ${
                              isLight ? 'bg-amber-100 text-stone-600' : 'bg-[#1c0f0a] border border-orange-500/20 text-orange-300'
                            }`}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div
                  className={`p-4 border-t flex items-center justify-between gap-2 ${
                    isLight ? 'border-amber-100 bg-amber-50/30' : 'border-orange-500/15 bg-[#170d09]/80'
                  }`}
                >
                  {/* Like button */}
                  <button
                    onClick={() => togglePublishedLikeAction(pkg.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono-code transition-colors ${
                      hasLiked
                        ? 'bg-orange-500/20 text-[#ff6b00] border border-orange-500/40'
                        : isLight
                        ? 'text-stone-600 hover:text-orange-600 hover:bg-orange-50'
                        : 'text-neutral-400 hover:text-orange-400 hover:bg-[#22130c]'
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${hasLiked ? 'fill-current text-[#ff6b00]' : ''}`} />
                    <span>{pkg.likesCount}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Inspect files button */}
                    <button
                      onClick={() => setInspectingPackage(pkg)}
                      title="Inspect files inside this bundle"
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono-code border transition-colors ${
                        isLight
                          ? 'border-amber-200 text-stone-700 hover:bg-amber-100'
                          : 'border-orange-500/30 text-orange-200 hover:bg-[#22130c]'
                      }`}
                    >
                      <Eye className="h-3 w-3 text-orange-400" />
                      <span>Files</span>
                    </button>

                    {/* Download Full ZIP */}
                    <button
                      onClick={() => handleDownloadZip(pkg)}
                      disabled={isDownloading}
                      className="flex items-center gap-1.5 rounded-lg bg-[#ff6b00] px-4 py-1.5 text-xs font-bold text-black shadow-sm hover:bg-[#ff7d1f] active:scale-95 transition-all disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border p-6 sm:p-8 shadow-2xl transition-colors ${
              isLight
                ? 'bg-white border-amber-200 text-stone-900'
                : 'bg-[#130b08] border-orange-500/30 text-white shadow-[0_20px_70px_-15px_rgba(255,107,0,0.25)]'
            }`}
          >
            <button
              onClick={() => setInspectingPackage(null)}
              className={`absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                isLight
                  ? 'border-amber-200 text-stone-500 hover:bg-amber-50 hover:text-stone-900'
                  : 'border-orange-500/30 text-orange-200 hover:bg-[#22130c] hover:text-white'
              }`}
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <span className="font-mono-code text-[11px] font-bold uppercase tracking-wider text-[#ff6b00]">
                  {inspectingPackage.id} • {inspectingPackage.category}
                </span>
              </div>
              <h2 className="mt-1 font-sans text-2xl font-bold">
                {inspectingPackage.title}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-3 font-mono-code text-xs opacity-75">
                <span>Published by <strong>@{inspectingPackage.authorUsername}</strong></span>
                <span>•</span>
                <span>{inspectingPackage.files.length} Assets</span>
                <span>•</span>
                <span>{inspectingPackage.totalSize}</span>
                <span>•</span>
                <span>{inspectingPackage.downloadsCount} downloads</span>
              </div>
              <p className={`mt-3 text-xs leading-relaxed ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
                {inspectingPackage.description}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleDownloadZip(inspectingPackage)}
                disabled={downloadingZipId === inspectingPackage.id}
                className="flex items-center gap-2 rounded-lg bg-[#ff6b00] px-6 py-2.5 text-xs font-bold text-black shadow-md shadow-orange-950/40 hover:bg-[#ff7d1f] transition-all disabled:opacity-50"
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
                className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-mono-code transition-colors ${
                  isLight
                    ? 'border-amber-300 text-stone-700 hover:bg-amber-100'
                    : 'border-orange-500/30 text-orange-200 hover:bg-[#22130c]'
                }`}
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5 text-[#ff6b00]" />}
                <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
              </button>
            </div>

            {/* Files List */}
            <div className={`border-t pt-4 ${isLight ? 'border-amber-200' : 'border-orange-500/20'}`}>
              <h4 className={`text-xs font-mono-code uppercase font-semibold mb-3 ${isLight ? 'text-amber-900' : 'text-orange-300'}`}>
                Included Files ({inspectingPackage.files.length})
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {inspectingPackage.files.map((file, idx) => (
                  <div
                    key={file.id}
                    className={`rounded-xl border p-3 flex items-center justify-between gap-3 ${
                      isLight ? 'border-amber-200 bg-amber-50/50' : 'border-orange-500/20 bg-[#190e09]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={file.url}
                        alt={file.name}
                        className="h-12 w-12 rounded-lg object-cover bg-black shrink-0"
                      />
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate font-mono-code ${isLight ? 'text-stone-900' : 'text-orange-100'}`}>{file.name}</p>
                        <p className="text-[10px] font-mono-code opacity-70 mt-0.5">{file.size}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownloadSingleFile(file, inspectingPackage.id)}
                      className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium shrink-0 transition-colors ${
                        isLight
                          ? 'border-amber-300 bg-white text-stone-800 hover:border-orange-500 hover:text-orange-600'
                          : 'border-orange-500/30 bg-[#24130c] text-orange-200 hover:border-[#ff6b00] hover:text-white'
                      }`}
                    >
                      <Download className="h-3 w-3 text-[#ff6b00]" />
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
