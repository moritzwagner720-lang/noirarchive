import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from './UserAvatar';
import {
  X,
  Upload,
  Camera,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface AvatarEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AvatarEditorModal: React.FC<AvatarEditorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, updateCustomAvatarAction } = useApp();

  const [rawImage, setRawImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (!isOpen || !currentUser) return null;

  const currentAvatar = currentUser.customAvatar || currentUser.avatar;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file is too large. Maximum size is 5MB.');
      return;
    }

    // Validate format
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Unsupported format. Please select a JPG, PNG, WebP, or GIF image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImage(reader.result as string);
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!rawImage) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !rawImage) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      if (rawImage) {
        // Render cropped canvas 256x256
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        if (!ctx) throw new Error('Canvas not available');

        const img = new Image();
        img.src = rawImage;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        // Clear and draw scaled and translated image
        ctx.fillStyle = '#1e1f22';
        ctx.fillRect(0, 0, 256, 256);

        ctx.save();
        ctx.translate(128 + offsetX * 0.8, 128 + offsetY * 0.8);
        ctx.scale(zoom, zoom);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();

        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        await updateCustomAvatarAction(croppedDataUrl);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile picture.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveCustomAvatar = async () => {
    setIsSaving(true);
    try {
      await updateCustomAvatarAction(null);
      setRawImage(null);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to remove custom picture.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border p-6 sm:p-8 bg-[#2b2d31] border-[#383a40] text-white shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl border border-[#383a40] text-neutral-400 hover:bg-[#313338] hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
            />
            <span className="font-mono-code text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              CUSTOM AVATAR STUDIO
            </span>
          </div>
          <h2 className="mt-1 font-sans text-xl font-bold text-white">
            Customize Profile Picture
          </h2>
          <p className="mt-1 text-xs text-neutral-400">
            Upload your own picture or return to your clean letter avatar at any time.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Interactive Cropping / Preview Box */}
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#1e1f22] border border-[#383a40]">
            {rawImage ? (
              <div className="relative flex flex-col items-center">
                <div
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="relative h-44 w-44 rounded-2xl overflow-hidden border-2 border-dashed border-indigo-500/60 bg-black cursor-grab active:cursor-grabbing select-none"
                >
                  <img
                    src={rawImage}
                    alt="Upload preview"
                    draggable={false}
                    className="absolute pointer-events-none origin-center"
                    style={{
                      transform: `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`,
                      top: '50%',
                      left: '50%',
                      marginTop: '-50%',
                      marginLeft: '-50%',
                      maxWidth: '100%',
                      maxHeight: '100%',
                    }}
                  />
                  <div className="absolute inset-0 pointer-events-none rounded-full ring-2 ring-white/30" />
                </div>
                <p className="mt-2 text-[11px] font-mono-code text-neutral-400">
                  Drag to pan • Use zoom slider below
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center py-4">
                <UserAvatar
                  username={currentUser.username}
                  avatarUrl={currentAvatar}
                  size="2xl"
                  shape="circle"
                />
                <div className="mt-3 text-center">
                  <p className="font-sans text-sm font-bold text-white">@{currentUser.username}</p>
                  <p className="text-[11px] text-neutral-400 font-mono-code mt-0.5">
                    {currentUser.customAvatar ? 'Custom picture active' : 'Default letter avatar'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Zoom Slider if image selected */}
          {rawImage && (
            <div className="space-y-1.5 p-3 rounded-xl bg-[#232428] border border-[#383a40]">
              <div className="flex items-center justify-between text-xs font-mono-code text-neutral-300">
                <span className="flex items-center gap-1">
                  <ZoomIn className="h-3.5 w-3.5" />
                  Scale / Zoom:
                </span>
                <span>{zoom.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="3"
                step="0.05"
                value={zoom}
                onChange={e => setZoom(parseFloat(e.target.value))}
                className="w-full accent-[var(--color-accent,#5865f2)]"
              />
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setOffsetX(0);
                    setOffsetY(0);
                  }}
                  className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white font-mono-code"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset Position</span>
                </button>
              </div>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Upload and Reset Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 font-mono-code text-xs font-semibold bg-[#232428] border border-[#383a40] text-white hover:bg-[#313338] transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{rawImage ? 'Choose Different Image' : 'Select New Image'}</span>
            </button>

            {currentUser.customAvatar && (
              <button
                type="button"
                onClick={handleRemoveCustomAvatar}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 font-mono-code text-xs font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Reset to Letter Avatar</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 pt-4 border-t border-[#383a40] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl text-neutral-400 hover:bg-[#313338] transition-colors"
          >
            Cancel
          </button>

          {rawImage && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
            >
              <Check className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Saving Picture...' : 'Save Profile Picture'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
