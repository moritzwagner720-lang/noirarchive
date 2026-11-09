import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Upload,
  Folder,
  File,
  Send,
  Users,
  Check,
  Copy,
  Layers,
  Shield,
  Clock,
  Sparkles,
  ArrowRight,
  Globe,
  Lock,
  Archive,
  Download,
} from 'lucide-react';
import { TransferFile } from '../types';

export const HeroTransferSection: React.FC = () => {
  const {
    currentUser,
    sendTransfer,
    publishPackageAction,
    setActiveTransferPortalId,
    setIsTransferModalOpen,
    setActiveTab,
    groups,
  } = useApp();

  const [dragActive, setDragActive] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<TransferFile[]>([]);
  const [transferTitle, setTransferTitle] = useState('Archive Delivery Package');
  const [destinationChoice, setDestinationChoice] = useState<'link' | 'friend' | 'group' | 'publish'>('link');
  const [targetUsername, setTargetUsername] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [createdTransferId, setCreatedTransferId] = useState<string | null>(null);
  const [publishedSuccessId, setPublishedSuccessId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

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
            type: file.type || 'application/octet-stream',
            folderPath: file.webkitRelativePath ? file.webkitRelativePath.split('/')[0] : 'Root',
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (stagedFiles.length === 0) {
      setIsTransferModalOpen(true);
      return;
    }

    if (destinationChoice === 'publish') {
      const res = publishPackageAction({
        title: transferTitle,
        description: 'Uploaded to the shared public vault for direct download.',
        authorUsername: currentUser.username,
        authorAvatar: '',
        category: 'bundles',
        files: stagedFiles,
      });

      if (res.success && res.package) {
        setPublishedSuccessId(res.package.id);
        setStagedFiles([]);
      }
    } else {
      const selectedGroup = groups.find(g => g.id === targetGroupId);

      const res = sendTransfer({
        senderId: currentUser.id,
        senderUsername: currentUser.username,
        title: transferTitle,
        recipientType: destinationChoice === 'group' ? 'group' : destinationChoice === 'friend' ? 'username' : 'direct-link',
        recipientUsername: destinationChoice === 'friend' ? targetUsername || currentUser.friends?.[0] : undefined,
        recipientGroupId: destinationChoice === 'group' ? targetGroupId : undefined,
        recipientGroupName: destinationChoice === 'group' ? selectedGroup?.name : undefined,
        password: hasPassword && password ? password : undefined,
        expiryDays: 14,
        files: stagedFiles,
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

  const totalStagedSize = stagedFiles.reduce((acc, f) => acc + (parseFloat(f.size) || 1), 0).toFixed(1);

  return (
    <div className="relative overflow-hidden bg-[#1e1f22] text-neutral-100">
      {/* Discord-style subtle mesh background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(88,101,242,0.12),transparent_70%)]" />

      {/* Hero Header Area */}
      <section className="relative z-10 mx-auto max-w-5xl px-4 pt-14 pb-8 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#383a40] bg-[#2b2d31] px-3.5 py-1 text-xs text-neutral-300 shadow-sm">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--color-accent, #5865f2)' }} />
          <span className="font-mono-code font-medium text-[11px] uppercase tracking-wider">
            High-Speed File & Folder Sharing
          </span>
        </div>

        <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white">
          Transfer files and folders.
          <span className="block mt-1 font-bold" style={{ color: 'var(--color-accent, #5865f2)' }}>
            Without limits or compromise.
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-neutral-300 font-normal leading-relaxed">
          Noir Archive is built for seamless directory transfers, individual assets, and secure group sharing.
          Fast, encrypted, and designed with a comfortable grey interface.
        </p>

        {/* Quick Hub Navigation Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setActiveTab('friends')}
            className="flex items-center gap-2 rounded-xl border border-[#383a40] bg-[#2b2d31] px-5 py-2.5 text-xs font-semibold text-neutral-200 hover:bg-[#313338] hover:border-neutral-500 transition-all shadow-sm"
          >
            <Users className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
            <span>Friend Groups & Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('published')}
            className="flex items-center gap-2 rounded-xl border border-[#383a40] bg-[#2b2d31] px-5 py-2.5 text-xs font-semibold text-neutral-200 hover:bg-[#313338] hover:border-neutral-500 transition-all shadow-sm"
          >
            <Globe className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
            <span>Community Shared Vault</span>
          </button>
        </div>
      </section>

      {/* Main Interactive Transfer Window */}
      <div className="relative z-10 px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-2xl border border-[#383a40] bg-[#2b2d31] shadow-2xl overflow-hidden">
          {/* Top Window Bar */}
          <div className="flex items-center justify-between border-b border-[#383a40] bg-[#232428] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#ec4899] opacity-80" />
              <span className="h-3 w-3 rounded-full bg-[#f59e0b] opacity-80" />
              <span className="h-3 w-3 rounded-full bg-[#10b981] opacity-80" />
              <span className="ml-3 font-mono-code text-[11px] font-medium text-neutral-400">
                Noir Dispatch Engine // Transfer Console
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-mono-code text-[11px] text-neutral-300 font-semibold">
                @{currentUser?.username || 'user'}
              </span>
            </div>
          </div>

          {/* Transfer Dispatch Form */}
          <div className="p-6 sm:p-8">
            {publishedSuccessId ? (
              <div className="py-8 text-center animate-in fade-in">
                <div
                  className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg"
                  style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                >
                  <Globe className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Package Published to Community Vault!
                </h3>
                <p className="mt-1 text-xs text-neutral-400 font-mono-code">
                  Package Reference: <strong className="text-white">{publishedSuccessId}</strong>
                </p>
                <div className="mt-5 flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setPublishedSuccessId(null);
                      setActiveTab('published');
                    }}
                    className="rounded-xl px-5 py-2 text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                  >
                    View in Shared Vault →
                  </button>
                  <button
                    onClick={() => setPublishedSuccessId(null)}
                    className="text-xs text-neutral-400 hover:text-white"
                  >
                    Send another package
                  </button>
                </div>
              </div>
            ) : createdTransferId ? (
              <div className="py-8 text-center animate-in fade-in">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Transfer Created Successfully!
                </h3>
                <p className="mt-1 text-xs text-neutral-400 font-mono-code">
                  Transfer Reference: <strong className="text-white">{createdTransferId}</strong>
                </p>

                <div className="mt-4 flex max-w-lg mx-auto items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${window.location.pathname}?transfer=${createdTransferId}`}
                    className="w-full rounded-xl border border-[#383a40] bg-[#1e1f22] py-2 px-3 text-xs font-mono-code text-white select-all focus:outline-none"
                  />
                  <button
                    onClick={() => copyLink(createdTransferId)}
                    className="rounded-xl px-4 py-2 text-xs font-bold text-white shrink-0 flex items-center gap-1.5 shadow-sm"
                    style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>

                <div className="mt-5 flex items-center justify-center gap-4 text-xs">
                  <button
                    onClick={() => setActiveTransferPortalId(createdTransferId)}
                    className="font-bold hover:underline"
                    style={{ color: 'var(--color-accent, #5865f2)' }}
                  >
                    Open Recipient Portal →
                  </button>
                  <button
                    onClick={() => setCreatedTransferId(null)}
                    className="text-neutral-400 hover:text-neutral-200"
                  >
                    Send another transfer
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
                  className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 transition-all ${
                    dragActive
                      ? 'border-[var(--color-accent)] bg-[#5865f2]/10'
                      : 'border-[#383a40] bg-[#1e1f22] hover:border-neutral-500 hover:bg-[#232428]'
                  }`}
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl mb-3 text-white shadow-md"
                    style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                  >
                    <Upload className="h-5 w-5" />
                  </div>

                  <p className="font-sans text-base font-bold text-white text-center">
                    Drag & drop files, software, archives, or whole folders
                  </p>
                  <p className="text-xs mt-1 text-neutral-400 font-mono-code text-center">
                    Instant staging for single assets, multi-file batches, or entire directories
                  </p>

                  {/* Staged counter */}
                  {stagedFiles.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#313338] border border-[#383a40] px-3 py-1 font-mono-code text-xs font-semibold text-white">
                      <span>✓ {stagedFiles.length} files staged ({totalStagedSize} MB)</span>
                      <button
                        type="button"
                        onClick={() => setStagedFiles([])}
                        className="text-neutral-400 hover:text-rose-400 ml-2"
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  {/* Buttons to select files or full directory */}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    <label className="rounded-xl border border-[#383a40] bg-[#2b2d31] hover:bg-[#313338] px-4 py-2 text-xs font-semibold cursor-pointer text-white transition-colors shadow-sm flex items-center gap-2">
                      <File className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
                      <span>Select Files</span>
                      <input type="file" multiple onChange={handleFileInput} className="hidden" />
                    </label>

                    <label className="rounded-xl border border-[#383a40] bg-[#2b2d31] hover:bg-[#313338] px-4 py-2 text-xs font-semibold cursor-pointer text-white transition-colors shadow-sm flex items-center gap-2">
                      <Folder className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
                      <span>Select Full Folder</span>
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

                  <p className="mt-3 text-[11px] font-mono-code text-neutral-400 text-center max-w-lg">
                    <strong className="text-neutral-300">Safety Notice:</strong> Uploaded files and folders are not automatically scanned for viruses or malicious code. Only transfer files from trusted sources. Never upload private keys, passwords, or confidential credentials.
                  </p>
                </div>

                {/* Transfer Title & Destination Selector */}
                <div className="space-y-3">
                  <div>
                    <label className="block font-mono-code text-[11px] uppercase tracking-wider text-neutral-300 font-bold mb-1">
                      Transfer Package Title
                    </label>
                    <input
                      type="text"
                      required
                      value={transferTitle}
                      onChange={e => setTransferTitle(e.target.value)}
                      className="w-full rounded-xl border border-[#383a40] bg-[#1e1f22] py-2 px-3 text-xs text-white focus:outline-none focus:border-[var(--color-accent)]"
                    />
                  </div>

                  {/* Destination Options: Link, Friend, Group, Publish */}
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="grid grid-cols-4 rounded-xl border border-[#383a40] bg-[#1e1f22] p-1 text-xs shrink-0 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setDestinationChoice('link')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                          destinationChoice === 'link'
                            ? 'bg-[#313338] text-white shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Direct Link
                      </button>

                      <button
                        type="button"
                        onClick={() => setDestinationChoice('friend')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                          destinationChoice === 'friend'
                            ? 'bg-[#313338] text-white shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        To Friend
                      </button>

                      <button
                        type="button"
                        onClick={() => setDestinationChoice('group')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                          destinationChoice === 'group'
                            ? 'bg-[#313338] text-white shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        To Group
                      </button>

                      <button
                        type="button"
                        onClick={() => setDestinationChoice('publish')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                          destinationChoice === 'publish'
                            ? 'bg-[#313338] text-white shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Public Vault
                      </button>
                    </div>

                    {/* Friend Picker */}
                    {destinationChoice === 'friend' && (
                      <select
                        value={targetUsername}
                        onChange={e => setTargetUsername(e.target.value)}
                        className="w-full sm:w-48 rounded-xl border border-[#383a40] bg-[#1e1f22] py-2 px-3 font-mono-code text-xs text-white focus:outline-none focus:border-[var(--color-accent)]"
                      >
                        <option value="">Choose friend...</option>
                        {(currentUser?.friends || []).map(f => (
                          <option key={f} value={f}>
                            @{f}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Group Picker (Requirement 4.8 & 4.9) */}
                    {destinationChoice === 'group' && (
                      <select
                        value={targetGroupId}
                        onChange={e => setTargetGroupId(e.target.value)}
                        className="w-full sm:w-52 rounded-xl border border-[#383a40] bg-[#1e1f22] py-2 px-3 font-mono-code text-xs text-white focus:outline-none focus:border-[var(--color-accent)]"
                      >
                        <option value="">Select friend group...</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>
                            {g.name} ({g.memberUsernames.length} members)
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Submit Dispatch Button */}
                    <button
                      type="submit"
                      className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 rounded-xl py-2 px-6 font-sans text-xs font-bold text-white shadow-md transition-all active:scale-95"
                      style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>
                        {destinationChoice === 'publish'
                          ? 'Publish to Shared Vault'
                          : destinationChoice === 'group'
                          ? 'Transfer to Group'
                          : destinationChoice === 'friend'
                          ? 'Transfer to Friend'
                          : 'Create Download Link'}
                      </span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* 3 Discord-Style Modern Feature Cards */}
        <div className="mx-auto mt-12 max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-[#383a40] bg-[#2b2d31] p-5 shadow-sm">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center text-white mb-3 shadow-sm"
              style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
            >
              <Folder className="h-5 w-5" />
            </div>
            <h3 className="font-sans text-sm font-bold text-white">
              Lossless Directory Transfers
            </h3>
            <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
              Upload and send whole directory trees with internal folder structures preserved without pre-compressing.
            </p>
          </div>

          <div className="rounded-2xl border border-[#383a40] bg-[#2b2d31] p-5 shadow-sm">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center text-white mb-3 shadow-sm"
              style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
            >
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-sans text-sm font-bold text-white">
              Friend & Group Delivery
            </h3>
            <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
              Organize your collaborators into custom groups and dispatch transfers to multiple recipients in one click.
            </p>
          </div>

          <div className="rounded-2xl border border-[#383a40] bg-[#2b2d31] p-5 shadow-sm">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center text-white mb-3 shadow-sm"
              style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
            >
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="font-sans text-sm font-bold text-white">
              Vault Access Protection
            </h3>
            <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
              Apply delivery passwords, set expiration dates, and revoke transfer links at any time with complete control.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
