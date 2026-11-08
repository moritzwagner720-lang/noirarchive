import React from 'react';
import { useApp } from '../context/AppContext';
import { Photo, GridLayout, PhotoCategory } from '../types';
import {
  Maximize2,
  Send,
  Camera,
  Layers,
  LayoutGrid,
  Columns2,
  Columns3,
  SlidersHorizontal,
} from 'lucide-react';

export const PhotoGrid: React.FC<{
  photos: Photo[];
  showControls?: boolean;
  emptyMessage?: string;
}> = ({ photos, showControls = true, emptyMessage = 'No photographs found in this collection.' }) => {
  const {
    gridLayout,
    setGridLayout,
    selectedCategory,
    setSelectedCategory,
    setLightboxPhoto,
    users,
    setSelectedPhotographer,
    setActiveTab,
    setIsTransferModalOpen,
    theme,
  } = useApp();

  const isLight = theme === 'light';

  const categories: { label: string; value: 'all' | PhotoCategory; color: string }[] = [
    { label: 'All Works', value: 'all', color: 'hover:text-[#ff6b00]' },
    { label: 'Architecture', value: 'architecture', color: 'text-orange-400' },
    { label: 'Portraiture', value: 'portraiture', color: 'text-amber-500' },
    { label: 'Street', value: 'street', color: 'text-[#ff6b00]' },
    { label: 'Nature', value: 'nature', color: 'text-emerald-500' },
    { label: 'Still Life', value: 'still-life', color: 'text-rose-500' },
  ];

  const filteredPhotos = photos.filter(p => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  const getGridClasses = () => {
    switch (gridLayout) {
      case 'grid-2':
        return 'grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12';
      case 'grid-3':
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6';
      case 'contact-sheet':
        return `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 border p-4 rounded-2xl ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-neutral-800 bg-neutral-950'
        }`;
      case 'masonry':
      default:
        return 'columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6';
    }
  };

  const getAspectClasses = (aspect: Photo['aspectRatio']) => {
    if (gridLayout === 'contact-sheet') {
      return 'aspect-square';
    }
    if (gridLayout === 'masonry') {
      switch (aspect) {
        case 'portrait':
          return 'aspect-[3/4]';
        case 'landscape':
          return 'aspect-[4/3]';
        case 'panoramic':
          return 'aspect-[16/9]';
        case 'square':
        default:
          return 'aspect-square';
      }
    }
    switch (aspect) {
      case 'portrait':
        return 'aspect-[4/5]';
      case 'landscape':
        return 'aspect-[3/2]';
      case 'panoramic':
        return 'aspect-[16/9]';
      case 'square':
      default:
        return 'aspect-square';
    }
  };

  const getCategoryBadgeClass = (category: PhotoCategory) => {
    switch (category) {
      case 'architecture':
        return 'border-cyan-500/40 text-cyan-300 bg-cyan-950/60';
      case 'portraiture':
        return 'border-violet-500/40 text-violet-300 bg-violet-950/60';
      case 'street':
        return 'border-amber-500/40 text-amber-300 bg-amber-950/60';
      case 'nature':
        return 'border-emerald-500/40 text-emerald-300 bg-emerald-950/60';
      case 'still-life':
        return 'border-rose-500/40 text-rose-300 bg-rose-950/60';
      default:
        return 'border-neutral-700 text-neutral-300 bg-neutral-900';
    }
  };

  return (
    <div className="w-full">
      {/* Controls Header */}
      {showControls && (
        <div className={`mb-8 flex flex-col gap-4 border-b pb-5 md:flex-row md:items-center md:justify-between transition-colors ${
          isLight ? 'border-slate-200' : 'border-neutral-800'
        }`}>
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1.5 text-xs font-mono-code uppercase tracking-wider rounded-lg transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-[#ff6b00] text-black font-bold shadow-sm'
                    : isLight
                    ? 'text-stone-600 hover:text-stone-900 hover:bg-amber-100/60'
                    : 'text-neutral-400 hover:text-white hover:bg-[#180e0a]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Layout Switcher */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="font-mono-code text-[10px] uppercase tracking-wider opacity-60 flex items-center gap-1 mr-1">
              <SlidersHorizontal className="h-3 w-3 text-[#ff6b00]" />
              Grid Mode:
            </span>

            <div className={`inline-flex rounded-lg border p-0.5 ${
              isLight ? 'border-amber-200 bg-amber-50' : 'border-orange-500/20 bg-[#160d09]'
            }`}>
              <button
                onClick={() => setGridLayout('grid-2')}
                title="2-Column Editorial View"
                className={`p-1.5 rounded-md transition-colors ${
                  gridLayout === 'grid-2' ? 'bg-[#ff6b00] text-black' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <Columns2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setGridLayout('grid-3')}
                title="3-Column Gallery View"
                className={`p-1.5 rounded-md transition-colors ${
                  gridLayout === 'grid-3' ? 'bg-[#ff6b00] text-black' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <Columns3 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setGridLayout('masonry')}
                title="Masonry Flow"
                className={`p-1.5 rounded-md transition-colors ${
                  gridLayout === 'masonry' ? 'bg-[#ff6b00] text-black' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setGridLayout('contact-sheet')}
                title="Analog Contact Sheet"
                className={`p-1.5 rounded-md transition-colors ${
                  gridLayout === 'contact-sheet' ? 'bg-[#ff6b00] text-black' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredPhotos.length === 0 ? (
        <div className={`flex min-h-[300px] flex-col items-center justify-center border-2 border-dashed rounded-2xl p-12 text-center ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-neutral-800 bg-neutral-900/30'
        }`}>
          <Camera className="mb-3 h-8 w-8 text-slate-400" />
          <h3 className="font-sans text-lg font-semibold">No photos in this category</h3>
          <p className="mt-1 font-mono-code text-xs opacity-60">{emptyMessage}</p>
        </div>
      ) : (
        /* The Gallery Grid */
        <div className={getGridClasses()}>
          {filteredPhotos.map((photo, idx) => {
            const author = users.find(u => u.id === photo.userId);
            const frameNum = String(idx + 1).padStart(2, '0');

            return (
              <div
                key={photo.id}
                className={`group relative overflow-hidden rounded-xl border transition-all duration-300 shadow-sm hover:shadow-md ${
                  isLight
                    ? 'bg-amber-50/70 border-amber-200 hover:border-amber-400'
                    : 'bg-[#140b07] border-orange-500/20 hover:border-orange-500/50'
                } ${gridLayout === 'masonry' ? 'break-inside-avoid mb-6' : ''}`}
              >
                {/* Contact Sheet Frame Header */}
                {gridLayout === 'contact-sheet' && (
                  <div className={`flex items-center justify-between border-b px-2 py-1 font-mono-code text-[9px] ${
                    isLight ? 'border-amber-200 bg-amber-50 text-stone-600' : 'border-orange-500/20 bg-[#1b0e08] text-neutral-400'
                  }`}>
                    <span className="text-[#ff6b00] font-bold">ARCHIVAL</span>
                    <span>FRAME #{frameNum}</span>
                  </div>
                )}

                {/* Photo Container */}
                <div
                  className={`relative w-full cursor-pointer overflow-hidden ${getAspectClasses(
                    photo.aspectRatio
                  )}`}
                  onClick={() => setLightboxPhoto(photo)}
                >
                  <img
                    src={photo.url}
                    alt={photo.title}
                    loading="lazy"
                    className="h-full w-full object-cover grayscale contrast-110 filter transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Darkroom Overlay on Hover */}
                  <div className="absolute inset-0 flex flex-col justify-between bg-black/80 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 text-white">
                    {/* Top Row: Camera Info & Category badge */}
                    <div className="flex items-start justify-between">
                      <span className={`font-mono-code text-[10px] tracking-wider px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(photo.category)}`}>
                        {photo.category.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setIsTransferModalOpen(true);
                          }}
                          title="Send photo to recipient"
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-600 bg-black/80 text-white transition-colors hover:border-[#ff6b00] hover:bg-[#ff6b00] hover:text-black"
                        >
                          <Send className="h-3 w-3" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setLightboxPhoto(photo);
                          }}
                          title="View fullscreen EXIF"
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-600 bg-black/80 text-white transition-colors hover:border-white hover:bg-white hover:text-black"
                        >
                          <Maximize2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Row: Metadata & Caption */}
                    <div>
                      <h4 className="font-sans text-sm font-bold tracking-wide text-white">
                        {photo.title}
                      </h4>
                      <p className="mt-0.5 line-clamp-1 font-sans text-xs text-neutral-300">
                        {photo.caption}
                      </p>
                      <div className="mt-2 flex items-center justify-between border-t border-orange-500/20 pt-2 font-mono-code text-[10px] text-neutral-400">
                        {author && (
                          <span className="text-[#ff6b00] font-semibold">
                            @{author.username}
                          </span>
                        )}
                        <span>
                          {photo.exif.focalLength} • {photo.exif.aperture} • ISO {photo.exif.iso}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-label for clean layout */}
                {gridLayout !== 'contact-sheet' && (
                  <div className={`flex items-center justify-between border-t px-3.5 py-2.5 font-mono-code text-[11px] ${
                    isLight ? 'border-amber-200/50 bg-amber-50/50 text-stone-800' : 'border-orange-500/20 bg-[#160b07] text-neutral-300'
                  }`}>
                    <span className="truncate max-w-[65%] font-sans text-xs font-medium">
                      {photo.title}
                    </span>
                    {author && (
                      <span className="text-[#ff6b00] text-[10px] font-semibold">
                        @{author.username}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
