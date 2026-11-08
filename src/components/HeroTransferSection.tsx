import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Upload,
  Folder,
  FileImage,
  Send,
  Users,
  Check,
  Copy,
  Sparkles,
  ArrowDown,
  Globe,
  Flame,
  Calendar,
  Trophy,
  Moon as MoonIcon,
  Download,
  FolderArchive,
  Terminal,
  Zap,
  Layers,
  Skull,
} from 'lucide-react';
import { TransferFile } from '../types';

export const HeroTransferSection: React.FC = () => {
  const {
    currentUser,
    sendTransfer,
    publishPackageAction,
    setActiveTransferPortalId,
    setIsTransferModalOpen,
    setIsPublishModalOpen,
    setAuthModal,
    setActiveTab,
    theme,
  } = useApp();

  const [dragActive, setDragActive] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<TransferFile[]>([]);
  const [transferTitle, setTransferTitle] = useState('Midnight Archival Batch');
  const [destinationChoice, setDestinationChoice] = useState<'publish' | 'link' | 'friend'>('publish');
  const [targetUsername, setTargetUsername] = useState('');
  const [createdTransferId, setCreatedTransferId] = useState<string | null>(null);
  const [publishedSuccessId, setPublishedSuccessId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>('hot');

  const isLight = theme === 'light';

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const processFiles = (fileList: FileList) => {
    Array.from(fileList).forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        setStagedFiles(prev => [
          ...prev,
          {
            id: `fast-${Date.now()}-${idx}`,
            name: file.name,
            url,
            size: `${sizeMb} MB`,
            type: file.type || 'image/jpeg',
            folderPath: 'Midnight_Batch',
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setAuthModal('signin');
      return;
    }

    if (stagedFiles.length === 0) {
      if (destinationChoice === 'publish') {
        setIsPublishModalOpen(true);
        return;
      }
      setIsTransferModalOpen(true);
      return;
    }

    const filesToSend: TransferFile[] = stagedFiles;

    if (destinationChoice === 'publish') {
      const res = publishPackageAction({
        title: transferTitle,
        description: 'Uploaded and published to the nocturnal public vault for open download.',
        authorUsername: currentUser.username,
        authorAvatar: currentUser.avatar,
        category: 'bundles',
        files: filesToSend,
      });

      if (res.success && res.package) {
        setPublishedSuccessId(res.package.id);
        setStagedFiles([]);
      }
    } else {
      const res = sendTransfer({
        senderId: currentUser.id,
        senderUsername: currentUser.username,
        title: transferTitle,
        recipientType: destinationChoice === 'link' ? 'direct-link' : 'username',
        recipientUsername: destinationChoice === 'friend' ? targetUsername || 'elena_k' : undefined,
        expiryDays: 14,
        files: filesToSend,
      });

      if (res.success && res.packageId) {
        setCreatedTransferId(res.packageId);
        setStagedFiles([]);
      }
    }
  };

  const copyLink = (id: string) => {
    const link = `${window.location.origin}${window.location.pathname}?transfer=${id}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const scrollToFriends = () => {
    const el = document.getElementById('friends-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setActiveTab('friends');
    }
  };

  return (
    <div
      className={`relative overflow-hidden transition-colors duration-200 ${
        isLight
          ? 'bg-gradient-to-b from-[#fdf8f4] via-[#faede3] to-[#f4e2d4] text-stone-900'
          : 'bg-[#090503] text-white'
      }`}
    >
      {/* Atmospheric Glows */}
      <div
        className={`pointer-events-none absolute inset-0 ${
          isLight
            ? 'bg-[radial-gradient(ellipse_90%_60%_at_50%_15%,rgba(255,107,0,0.08),rgba(217,119,6,0.04)_55%,transparent_85%)]'
            : 'bg-[radial-gradient(ellipse_90%_60%_at_50%_15%,rgba(255,107,0,0.18),rgba(154,52,18,0.06)_55%,transparent_85%)]'
        }`}
      />
      <div
        className={`pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[1000px] rounded-full blur-[140px] ${
          isLight
            ? 'bg-gradient-to-b from-orange-400/10 via-amber-200/20 to-transparent'
            : 'bg-gradient-to-b from-orange-600/10 via-amber-900/10 to-transparent'
        }`}
      />

      {/* Floating Full Harvest Moon */}
      <div className="pointer-events-none absolute right-4 sm:right-12 md:right-20 lg:right-32 top-16 sm:top-20 z-0 opacity-90 sm:opacity-100">
        <div className="relative h-44 w-44 sm:h-64 sm:w-64 md:h-76 md:w-76 rounded-full bg-gradient-to-br from-[#fff7d6] via-[#f7d68a] to-[#c98d36] moon-glow">
          {/* Moon Craters */}
          <div className="absolute top-12 left-10 h-7 w-7 rounded-full bg-[#9e6d23]/25 blur-[1.5px]" />
          <div className="absolute top-24 left-20 h-12 w-12 rounded-full bg-[#8f5e19]/25 blur-[2.5px]" />
          <div className="absolute top-36 left-12 h-6 w-6 rounded-full bg-[#a16f27]/30 blur-[1px]" />
          <div className="absolute top-14 right-14 h-9 w-9 rounded-full bg-[#94621c]/25 blur-[2px]" />
          <div className="absolute bottom-12 right-20 h-10 w-10 rounded-full bg-[#875514]/30 blur-[2px]" />
          <div className="absolute bottom-20 left-28 h-5 w-5 rounded-full bg-[#a16f27]/25 blur-[1px]" />
          {/* Subtle moon surface shadow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/20 via-transparent to-white/30" />
        </div>
      </div>

      {/* Hero Header Area */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 pt-16 pb-12 sm:pt-24 sm:pb-16 sm:px-6 text-center">
        {/* Grave Kicker Tag */}
        <div
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 backdrop-blur-md shadow-sm transition-colors ${
            isLight
              ? 'border-orange-300 bg-white/90 text-stone-800 shadow-orange-500/10'
              : 'border-orange-500/30 bg-[#170c07]/80 text-orange-200/90 shadow-orange-950/40'
          }`}
        >
          <span className="text-orange-500 font-bold text-xs animate-pulse">✶</span>
          <span className="font-mono-code text-xs tracking-wide font-medium">
            v5.0 just rose from the darkroom grave!
          </span>
        </div>

        {/* The Headline (dripping Halloween style) */}
        <div className="mt-6 space-y-1">
          <h1 className={`font-sans text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight ${
            isLight ? 'text-stone-900' : 'text-white'
          }`}>
            The archive vault
          </h1>
          <h2 className="font-spooky text-5xl sm:text-7xl md:text-8xl tracking-wider text-[#ff6b00] text-spooky-glow py-1">
            that refuses to die.
          </h2>
        </div>

        {/* Hero Paragraph */}
        <p className={`mx-auto mt-5 max-w-2xl font-sans text-sm sm:text-base leading-relaxed font-normal ${
          isLight ? 'text-stone-700' : 'text-neutral-300'
        }`}>
          Noir Archive is the nocturnal platform allowing you to transfer, curate, and download high-contrast
          photography and lossless directory bundles. Cut off one transfer link and two more grow back.
        </p>

        {/* Hero CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => {
              if (!currentUser) {
                setAuthModal('signin');
              } else {
                setIsPublishModalOpen(true);
              }
            }}
            className="flex items-center gap-2.5 rounded-lg bg-[#ff6b00] px-7 py-3 text-sm font-bold text-black shadow-lg shadow-orange-900/30 hover:bg-[#ff7d1f] hover:scale-105 active:scale-95 transition-all"
          >
            <Download className="h-4 w-4 stroke-[2.5]" />
            <span>Publish Files Now</span>
          </button>

          <button
            onClick={() => setActiveTab('explore')}
            className={`flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-semibold backdrop-blur-md transition-all ${
              isLight
                ? 'border-orange-300 bg-white text-stone-800 shadow-sm hover:bg-orange-50 hover:border-orange-400'
                : 'border-orange-500/60 bg-[#150c08]/80 text-neutral-200 hover:bg-[#1f120c] hover:border-orange-400 hover:text-white'
            }`}
          >
            <FolderArchive className="h-4 w-4 text-orange-500" />
            <span>Explore Midnight Gallery</span>
          </button>
        </div>
      </section>

      {/* Spooky Horizon Silhouette with Bare Gnarly Trees */}
      <div className="relative w-full overflow-hidden pointer-events-none -mb-1 select-none">
        {/* Amber Horizon Line */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#ff6b00]/60 to-transparent shadow-[0_0_12px_#ff6b00]" />

        {/* SVG Spooky Landscape with Crooked Trees on left and right */}
        <div className="relative h-20 sm:h-28 w-full">
          <svg
            className={`absolute bottom-0 w-full h-full transition-colors ${
              isLight ? 'text-[#e9d6c4]' : 'text-[#080402]'
            }`}
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            {/* Dark Hills Terrain */}
            <path d="M0,120 L0,70 Q250,55 500,80 T1000,65 Q1250,50 1440,75 L1440,120 Z" />

            {/* Left Spooky Bare Tree */}
            <g transform="translate(130, 10) scale(0.9)" stroke="currentColor" strokeWidth="3" fill="currentColor">
              <path d="M40,110 L45,40 L35,25 L15,15 M35,25 L30,5 M45,40 L60,25 L75,10 M60,25 L55,5 M45,65 L20,50 L5,45 M20,50 L25,35 M45,65 L70,55 L85,45" />
            </g>

            {/* Right Spooky Bare Tree */}
            <g transform="translate(1280, 10) scale(0.9)" stroke="currentColor" strokeWidth="3" fill="currentColor">
              <path d="M40,110 L45,40 L35,25 L15,15 M35,25 L30,5 M45,40 L60,25 L75,10 M60,25 L55,5 M45,65 L20,50 L5,45 M20,50 L25,35 M45,65 L70,55 L85,45" />
            </g>
          </svg>
        </div>
      </div>

      {/* Interactive App Window Container */}
      <div className={`relative z-10 px-4 pb-20 sm:px-6 transition-colors ${
        isLight ? 'bg-[#e9d6c4]/45' : 'bg-[#080402]'
      }`}>
        <div className={`mx-auto max-w-5xl rounded-2xl border overflow-hidden backdrop-blur-xl transition-all ${
          isLight
            ? 'border-amber-300/80 bg-white/95 text-stone-900 shadow-2xl shadow-orange-950/10'
            : 'border-orange-500/25 bg-[#120a07]/95 text-white shadow-[0_25px_80px_-15px_rgba(255,107,0,0.15)]'
        }`}>
          {/* Mac-style Window Top Bar */}
          <div className={`flex items-center justify-between border-b px-4 py-3 transition-colors ${
            isLight
              ? 'border-amber-200/80 bg-[#fdfaf8] text-stone-800'
              : 'border-orange-500/15 bg-[#170d09] text-white'
          }`}>
            {/* 3 Mac dots: red, yellow, green */}
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#ff5f56] inline-block shadow-sm" />
              <span className="h-3 w-3 rounded-full bg-[#ffbd2e] inline-block shadow-sm" />
              <span className="h-3 w-3 rounded-full bg-[#27c93f] inline-block shadow-sm" />
              <span className={`ml-3 hidden sm:inline-block font-mono-code text-[11px] font-medium ${
                isLight ? 'text-amber-800' : 'text-orange-400/80'
              }`}>
                Noir Archive Vault // Midnight Engine
              </span>
            </div>

            {/* Mode / User status */}
            <div className="flex items-center gap-3">
              {currentUser ? (
                <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                  isLight
                    ? 'bg-amber-100 border-amber-300 text-stone-800'
                    : 'bg-[#24130c] border-orange-500/30 text-orange-200'
                }`}>
                  <span className="h-2 w-2 rounded-full bg-[#ff6b00] animate-pulse" />
                  <span className="font-mono-code text-[11px]">@{currentUser.username}</span>
                </div>
              ) : (
                <span className={`font-mono-code text-[10px] ${isLight ? 'text-stone-500' : 'text-neutral-400'}`}>
                  Guest Access · Login to Dispatch
                </span>
              )}
            </div>
          </div>

          {/* Quick Category / Mode Tabs */}
          <div className={`flex flex-wrap items-center gap-2 border-b px-4 py-2.5 sm:px-6 transition-colors ${
            isLight ? 'border-amber-200/80 bg-[#fbf5f0]' : 'border-orange-500/15 bg-[#140b08]'
          }`}>
            <button
              onClick={() => setActiveQuickFilter('hot')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeQuickFilter === 'hot'
                  ? 'bg-[#ff6b00] text-black shadow-sm'
                  : isLight
                  ? 'bg-white text-stone-700 hover:text-stone-900 border border-amber-300/80 hover:bg-amber-50'
                  : 'bg-[#1e100a] text-neutral-300 hover:text-white border border-orange-500/20'
              }`}
            >
              <Flame className="h-3.5 w-3.5 fill-current text-current" />
              <span>Hot now</span>
            </button>

            <button
              onClick={() => setActiveQuickFilter('weekly')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeQuickFilter === 'weekly'
                  ? 'bg-[#ff6b00] text-black shadow-sm'
                  : isLight
                  ? 'bg-white text-stone-700 hover:text-stone-900 border border-amber-300/80 hover:bg-amber-50'
                  : 'bg-[#1e100a] text-neutral-300 hover:text-white border border-orange-500/20'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Top archives of the week</span>
            </button>

            <button
              onClick={() => setActiveQuickFilter('creators')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeQuickFilter === 'creators'
                  ? 'bg-[#ff6b00] text-black shadow-sm'
                  : isLight
                  ? 'bg-white text-stone-700 hover:text-stone-900 border border-amber-300/80 hover:bg-amber-50'
                  : 'bg-[#1e100a] text-neutral-300 hover:text-white border border-orange-500/20'
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>Vault to explore</span>
            </button>

            <button
              onClick={() => {
                setActiveQuickFilter('surprise');
                setActiveTab('explore');
              }}
              className={`ml-auto hidden sm:flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                isLight
                  ? 'bg-amber-100/70 border-amber-300 text-stone-800 hover:bg-amber-100'
                  : 'bg-[#22120a] border-orange-500/30 text-orange-300 hover:border-orange-400 hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Surprise archive</span>
            </button>
          </div>

          {/* Interactive Vault Dispatch Form / Dropzone */}
          <div className="p-6 sm:p-8">
            {publishedSuccessId ? (
              <div className="py-6 text-center animate-in fade-in">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/20 text-[#ff6b00] border border-orange-500/40 shadow-lg">
                  <Globe className="h-7 w-7" />
                </div>
                <h3 className={`text-2xl font-bold font-sans ${isLight ? 'text-stone-900' : 'text-white'}`}>
                  Files Published to Vault!
                </h3>
                <p className={`mt-1 text-xs font-mono-code ${isLight ? 'text-stone-600' : 'text-orange-300/80'}`}>
                  Reference: <strong className="text-[#ff6b00]">{publishedSuccessId}</strong> — Open for direct community download.
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setPublishedSuccessId(null);
                      setActiveTab('published');
                    }}
                    className="rounded-lg bg-[#ff6b00] px-5 py-2.5 text-xs font-bold text-black shadow hover:bg-[#ff7d1f] transition-all"
                  >
                    View in Public Downloads →
                  </button>
                  <button
                    onClick={() => setPublishedSuccessId(null)}
                    className={`text-xs font-mono-code ${isLight ? 'text-stone-500 hover:text-stone-900' : 'text-neutral-400 hover:text-neutral-200'}`}
                  >
                    Upload another
                  </button>
                </div>
              </div>
            ) : createdTransferId ? (
              <div className="py-6 text-center animate-in fade-in">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/40">
                  <Check className="h-7 w-7" />
                </div>
                <h3 className={`text-2xl font-bold font-sans ${isLight ? 'text-stone-900' : 'text-white'}`}>
                  Transfer Link Ready
                </h3>
                <p className={`mt-1 text-xs font-mono-code ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
                  Reference: <strong className="text-orange-500">{createdTransferId}</strong>
                </p>

                <div className="mt-4 flex max-w-lg mx-auto items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${window.location.pathname}?transfer=${createdTransferId}`}
                    className={`w-full rounded-lg border py-2.5 px-3.5 text-xs font-mono-code select-all focus:outline-none ${
                      isLight
                        ? 'border-amber-300 bg-amber-50 text-stone-900'
                        : 'border-orange-500/30 bg-[#160d09] text-orange-200'
                    }`}
                  />
                  <button
                    onClick={() => copyLink(createdTransferId)}
                    className="rounded-lg bg-[#ff6b00] px-4 py-2.5 text-xs font-bold text-black hover:bg-[#ff7d1f] transition-colors shrink-0 flex items-center gap-1.5"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="mt-5 flex items-center justify-center gap-4 text-xs font-mono-code">
                  <button
                    onClick={() => setActiveTransferPortalId(createdTransferId)}
                    className="text-[#ff6b00] font-bold hover:underline"
                  >
                    Open Recipient Portal →
                  </button>
                  <button
                    onClick={() => setCreatedTransferId(null)}
                    className={isLight ? 'text-stone-500 hover:text-stone-900' : 'text-neutral-500 hover:text-neutral-300'}
                  >
                    Send another
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleActionSubmit} className="space-y-5">
                {/* Drag & Drop Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 sm:p-10 transition-all ${
                    dragActive
                      ? 'border-[#ff6b00] bg-orange-500/10'
                      : isLight
                      ? 'border-amber-300 bg-amber-50/60 hover:border-amber-400 hover:bg-amber-100/50'
                      : 'border-orange-500/30 bg-[#170e0a]/60 hover:border-orange-500/50 hover:bg-[#1a100b]/80'
                  }`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full border mb-3 shadow-md ${
                    isLight
                      ? 'bg-amber-100 border-amber-300 text-orange-600'
                      : 'bg-[#25130b] border-orange-500/40 text-[#ff6b00]'
                  }`}>
                    <Upload className="h-5 w-5" />
                  </div>

                  <p className={`font-sans text-base font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>
                    Drag & drop photographs, RAW files, or whole folders
                  </p>
                  <p className={`text-xs mt-1 font-mono-code ${isLight ? 'text-stone-600' : 'text-orange-200/70'}`}>
                    Instant staging for full photography portfolios, ZIP packages, and client deliveries
                  </p>

                  {/* Staged files counter */}
                  {stagedFiles.length > 0 && (
                    <div className="mt-3 text-xs font-mono-code font-bold text-[#ff6b00]">
                      {stagedFiles.length} files staged ({stagedFiles.reduce((acc, f) => acc + (parseFloat(f.size) || 1), 0).toFixed(1)} MB)
                    </div>
                  )}

                  {/* Buttons to select files or directory */}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    <label className={`rounded-lg border px-4 py-2 text-xs font-semibold cursor-pointer transition-colors shadow-sm ${
                      isLight
                        ? 'border-amber-300 bg-white text-stone-800 hover:bg-amber-50 hover:border-orange-500'
                        : 'border-orange-500/40 bg-[#22130c] text-neutral-200 hover:border-[#ff6b00] hover:text-white'
                    }`}>
                      <span className="flex items-center gap-1.5">
                        <FileImage className="h-3.5 w-3.5 text-[#ff6b00]" />
                        Select Files
                      </span>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileInput}
                        className="hidden"
                      />
                    </label>

                    <label className={`rounded-lg border px-4 py-2 text-xs font-semibold cursor-pointer transition-colors shadow-sm ${
                      isLight
                        ? 'border-amber-300 bg-white text-stone-800 hover:bg-amber-50 hover:border-amber-500'
                        : 'border-amber-600/40 bg-[#22130c] text-neutral-200 hover:border-amber-500 hover:text-white'
                    }`}>
                      <span className="flex items-center gap-1.5">
                        <Folder className="h-3.5 w-3.5 text-amber-500" />
                        Select Full Folder
                      </span>
                      {/* @ts-ignore */}
                      <input
                        type="file"
                        // @ts-expect-error webkitdirectory
                        webkitdirectory=""
                        directory=""
                        multiple
                        onChange={handleFileInput}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Destination Controls & Submit */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                  <div className={`inline-flex w-full sm:w-auto rounded-lg border p-1 text-xs shrink-0 ${
                    isLight
                      ? 'border-amber-300 bg-amber-100/70'
                      : 'border-orange-500/20 bg-[#170e0a]'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setDestinationChoice('publish')}
                      className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md transition-all font-semibold ${
                        destinationChoice === 'publish'
                          ? 'bg-[#ff6b00] text-black shadow-sm'
                          : isLight
                          ? 'text-stone-700 hover:text-stone-950'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Publish to Vault
                    </button>

                    <button
                      type="button"
                      onClick={() => setDestinationChoice('link')}
                      className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md transition-all font-semibold ${
                        destinationChoice === 'link'
                          ? 'bg-[#ff6b00] text-black shadow-sm'
                          : isLight
                          ? 'text-stone-700 hover:text-stone-950'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Shareable Link
                    </button>

                    <button
                      type="button"
                      onClick={() => setDestinationChoice('friend')}
                      className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md transition-all font-semibold ${
                        destinationChoice === 'friend'
                          ? 'bg-[#ff6b00] text-black shadow-sm'
                          : isLight
                          ? 'text-stone-700 hover:text-stone-950'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      To Friend
                    </button>
                  </div>

                  {destinationChoice === 'friend' && (
                    <select
                      value={targetUsername}
                      onChange={e => setTargetUsername(e.target.value)}
                      className={`w-full rounded-lg border py-2 px-3 font-mono-code text-xs focus:outline-none ${
                        isLight
                          ? 'border-amber-300 bg-white text-stone-900 focus:border-[#ff6b00]'
                          : 'border-orange-500/30 bg-[#160d09] text-orange-200 focus:border-[#ff6b00]'
                      }`}
                    >
                      <option value="">Select a friend handle...</option>
                      {(currentUser?.friends || ['elena_k', 'kenji_mono']).map(f => (
                        <option key={f} value={f}>
                          @{f}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    type="submit"
                    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#ff6b00] py-2.5 px-6 font-sans text-xs font-bold text-black hover:bg-[#ff7d1f] shadow-lg shadow-orange-950/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Send className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>
                      {destinationChoice === 'publish'
                        ? 'Publish for Public Download'
                        : destinationChoice === 'link'
                        ? 'Create Nocturnal Link'
                        : 'Transfer to Friend'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* 3 Halloween Feature Columns */}
        <div className={`mx-auto mt-14 max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8 border-t pt-10 ${
          isLight ? 'border-amber-300/80' : 'border-orange-500/25'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border shadow-sm ${
              isLight
                ? 'bg-amber-100 border-amber-300 text-orange-600'
                : 'bg-[#1a0e09] border-orange-500/40 text-[#ff6b00]'
            }`}>
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className={`font-sans text-sm font-bold tracking-wide ${isLight ? 'text-stone-900' : 'text-white'}`}>
                Embedded Downloader & Vault
              </h3>
              <p className={`mt-1 text-xs leading-relaxed ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
                Noir Archive's built-in vault engine centralizes all your raw captures in one place, so clients can download with frightening speed.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border shadow-sm ${
              isLight
                ? 'bg-amber-100 border-amber-300 text-orange-600'
                : 'bg-[#1a0e09] border-orange-500/40 text-[#ff6b00]'
            }`}>
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className={`font-sans text-sm font-bold tracking-wide ${isLight ? 'text-stone-900' : 'text-white'}`}>
                Cross-Platform Folder Sync
              </h3>
              <p className={`mt-1 text-xs leading-relaxed ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
                No platform is locked out. Deliver full directory trees, single captures, or high-res ZIP bundles without compromise.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border shadow-sm ${
              isLight
                ? 'bg-amber-100 border-amber-300 text-orange-600'
                : 'bg-[#1a0e09] border-orange-500/40 text-[#ff6b00]'
            }`}>
              <MoonIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className={`font-sans text-sm font-bold tracking-wide ${isLight ? 'text-stone-900' : 'text-white'}`}>
                Immortal Darkroom Archives
              </h3>
              <p className={`mt-1 text-xs leading-relaxed ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
                Like any good creature of the night, Noir Archive refuses to die. High-contrast preservation that outlasts the darkness.
              </p>
            </div>
          </div>
        </div>

        {/* Quick jump to Add Friends & Messenger */}
        <div className="mt-10 flex items-center justify-center">
          <button
            onClick={scrollToFriends}
            className={`flex items-center gap-2 text-xs font-mono-code transition-colors group ${
              isLight ? 'text-stone-600 hover:text-orange-600' : 'text-orange-400/80 hover:text-[#ff6b00]'
            }`}
          >
            <Users className="h-3.5 w-3.5 text-[#ff6b00]" />
            <span>Scroll down to Add Friends & Peer Messenger</span>
            <ArrowDown className="h-3 w-3 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
