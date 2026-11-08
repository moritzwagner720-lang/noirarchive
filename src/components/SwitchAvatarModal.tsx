import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  COLOR_PALETTE,
  PRESET_AVATARS,
  getDefaultAvatarInitial,
  getRandomColorForUsername,
  generateLetterAvatar,
} from '../utils/avatar';
import {
  X,
  Sparkles,
  Upload,
  Palette,
  Image as ImageIcon,
  Check,
  Shuffle,
  Camera,
  Link as LinkIcon,
  User as UserIcon,
} from 'lucide-react';

export const SwitchAvatarModal: React.FC = () => {
  const { currentUser, isAvatarModalOpen, setIsAvatarModalOpen, updateUserAvatar, theme } = useApp();
  const isLight = theme === 'light';

  // Mode tabs: 'letter' | 'upload' | 'preset' | 'url'
  const [activeTab, setActiveTab] = useState<'letter' | 'upload' | 'preset' | 'url'>('letter');

  // Letter avatar state
  const [letter, setLetter] = useState('3');
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [useGradient, setUseGradient] = useState(true);

  // Photo upload / URL state
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Current preview
  const [previewAvatar, setPreviewAvatar] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize from currentUser
  useEffect(() => {
    if (currentUser && isAvatarModalOpen) {
      const initial = getDefaultAvatarInitial(currentUser.username);
      const color = getRandomColorForUsername(currentUser.username);
      setLetter(initial);
      setSelectedColor(color);
      setUseGradient(true);

      // Default preview is the generated initial avatar or current avatar
      if (currentUser.avatar && !currentUser.avatar.startsWith('data:image/svg+xml')) {
        setPreviewAvatar(currentUser.avatar);
      } else {
        setPreviewAvatar(generateLetterAvatar(initial, color.hex, color.secondaryHex));
      }
      setSaveSuccess(false);
    }
  }, [currentUser, isAvatarModalOpen]);

  // Update letter avatar preview whenever letter or color changes
  useEffect(() => {
    if (activeTab === 'letter') {
      const sec = useGradient ? selectedColor.secondaryHex : undefined;
      const svg = generateLetterAvatar(letter, selectedColor.hex, sec);
      setPreviewAvatar(svg);
    }
  }, [letter, selectedColor, useGradient, activeTab]);

  if (!isAvatarModalOpen || !currentUser) return null;

  const handleRandomizeColor = () => {
    const available = COLOR_PALETTE.filter(c => c.id !== selectedColor.id);
    const random = available[Math.floor(Math.random() * available.length)];
    setSelectedColor(random);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please choose a valid image file (JPG, PNG, WebP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setUploadedDataUrl(result);
        setPreviewAvatar(result);
        setActiveTab('upload');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (url: string) => {
    setSelectedPreset(url);
    setPreviewAvatar(url);
  };

  const handleApplyCustomUrl = () => {
    if (customUrl.trim()) {
      setPreviewAvatar(customUrl.trim());
    }
  };

  const handleSave = async () => {
    if (!previewAvatar) return;
    setIsSaving(true);
    await updateUserAvatar(previewAvatar);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => {
      setIsAvatarModalOpen(false);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all my-8 ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0e0e14] border-neutral-800 text-white'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Switch Profile Picture</h3>
              <p className="text-xs text-neutral-400">
                Choose a colorful initial letter or upload a custom photo
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAvatarModalOpen(false)}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Profile Preview Card */}
        <div className="my-5 flex flex-col items-center justify-center p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="relative group">
            <div className="h-24 w-24 rounded-full p-1 bg-gradient-to-tr from-blue-500 via-indigo-500 to-pink-500 shadow-xl">
              <img
                src={previewAvatar || currentUser.avatar}
                alt={currentUser.username}
                className="h-full w-full rounded-full object-cover bg-black"
              />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg border border-black"
              title="Upload Photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-3 text-center">
            <span className="font-mono-code text-xs font-semibold text-white">@{currentUser.username}</span>
            <p className="text-[11px] text-neutral-400 font-mono-code">Live Avatar Preview</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          className={`grid grid-cols-4 gap-1 p-1 rounded-xl border text-xs font-mono-code mb-5 ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-neutral-900 border-neutral-800'
          }`}
        >
          <button
            onClick={() => setActiveTab('letter')}
            className={`py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'letter'
                ? 'bg-blue-600 text-white shadow-sm'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Letter</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('upload');
              fileInputRef.current?.click();
            }}
            className={`py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white shadow-sm'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>

          <button
            onClick={() => setActiveTab('preset')}
            className={`py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'preset'
                ? 'bg-blue-600 text-white shadow-sm'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Presets</span>
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={`py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'url'
                ? 'bg-blue-600 text-white shadow-sm'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>URL</span>
          </button>
        </div>

        {/* Hidden File Input for Image Upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Tab 1: Letter Avatar Generator (Colorful Backgrounds) */}
        {activeTab === 'letter' && (
          <div className="space-y-4">
            {/* Initial Letter/Character Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium font-mono-code text-neutral-300">
                  Initial Character / Letter:
                </label>
                <span className="text-[10px] text-blue-400 font-mono-code">
                  e.g. '3' for k3nanbaba, 'K', or initials
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={2}
                  value={letter}
                  onChange={e => setLetter(e.target.value.toUpperCase())}
                  placeholder="3"
                  className={`w-20 text-center font-bold text-lg rounded-xl border py-2 px-3 font-mono-code focus:outline-none focus:border-blue-500 ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-700 text-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setLetter(getDefaultAvatarInitial(currentUser.username))}
                  className="px-3 py-2 rounded-xl border border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-xs text-neutral-300 font-mono-code"
                >
                  Reset to Default ('{getDefaultAvatarInitial(currentUser.username)}')
                </button>
              </div>
            </div>

            {/* Vibrant Colorful Colors */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium font-mono-code text-neutral-300">
                  Pick a Colorful Color:
                </label>
                <button
                  type="button"
                  onClick={handleRandomizeColor}
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-mono-code"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>Random Color</span>
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {COLOR_PALETTE.map(color => {
                  const isSelected = selectedColor.id === color.id;
                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      style={{ backgroundColor: color.hex }}
                      className={`h-10 rounded-xl relative flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md ${
                        isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-105' : 'opacity-90 hover:opacity-100'
                      }`}
                      title={color.name}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] font-mono-code text-neutral-400">
                Selected: <strong className="text-white">{selectedColor.name}</strong> ({selectedColor.hex})
              </p>
            </div>

            {/* Gradient toggle */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-mono-code text-neutral-300">Vibrant Gradient Finish:</span>
              <button
                type="button"
                onClick={() => setUseGradient(!useGradient)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  useGradient ? 'bg-blue-600' : 'bg-neutral-800'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useGradient ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Upload Custom Photo */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-700 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-neutral-900/40 hover:bg-neutral-900/80"
            >
              <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-neutral-200">
                Click to browse photo from your device
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">Supports PNG, JPG, WebP, GIF</p>
            </div>
            {uploadedDataUrl && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                <span className="text-xs text-green-400 font-mono-code">Photo loaded successfully!</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-blue-400 hover:underline"
                >
                  Change Photo
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Presets */}
        {activeTab === 'preset' && (
          <div>
            <p className="text-xs text-neutral-400 font-mono-code mb-3">
              Choose from studio portraits and darkroom photography presets:
            </p>
            <div className="grid grid-cols-3 gap-3">
              {PRESET_AVATARS.map(preset => {
                const isSelected = previewAvatar === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.url)}
                    className={`relative rounded-xl overflow-hidden border transition-all text-left group ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500'
                        : 'border-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.title}
                      className="h-20 w-full object-cover grayscale group-hover:grayscale-0 transition-all"
                    />
                    <div className="p-1.5 bg-black/90">
                      <p className="text-[10px] font-mono-code truncate text-neutral-300">
                        {preset.title}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-blue-600 text-white">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Direct URL */}
        {activeTab === 'url' && (
          <div className="space-y-3">
            <label className="text-xs font-mono-code text-neutral-300">Paste Image URL:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className={`flex-1 rounded-xl border py-2 px-3 text-xs font-mono-code focus:outline-none focus:border-blue-500 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-700 text-white'
                }`}
              />
              <button
                type="button"
                onClick={handleApplyCustomUrl}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Apply
              </button>
            </div>
            <p className="text-[11px] text-neutral-500">
              Provide any public image link (e.g., Unsplash, GitHub, Gravatar).
            </p>
          </div>
        )}

        {/* Modal Actions */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsAvatarModalOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-mono-code text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || saveSuccess}
            className={`px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all ${
              saveSuccess
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-105 active:scale-95'
            }`}
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Profile Picture Updated!</span>
              </>
            ) : isSaving ? (
              <span>Saving Avatar...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Profile Picture</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
