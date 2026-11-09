import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TransferFile } from '../types';
import { UserAvatar } from './UserAvatar';
import {
  X,
  Send,
  Folder,
  File,
  Upload,
  Lock,
  Calendar,
  Check,
  Copy,
  ExternalLink,
  Shield,
  Layers,
  AlertCircle,
  Users,
} from 'lucide-react';

export const SendTransferModal: React.FC = () => {
  const {
    currentUser,
    isTransferModalOpen,
    setIsTransferModalOpen,
    users,
    groups,
    sendTransfer,
    setActiveTransferPortalId,
    setActiveTab,
  } = useApp();

  const [step, setStep] = useState<'configure' | 'success'>('configure');
  const [createdPackageId, setCreatedPackageId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State
  const [transferTitle, setTransferTitle] = useState('File Delivery Package');
  const [transferNote, setTransferNote] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<TransferFile[]>([]);

  // Recipient destination: 'direct-link' | 'friend' | 'group'
  const [recipientType, setRecipientType] = useState<'direct-link' | 'friend' | 'group'>('direct-link');
  const [recipientUsername, setRecipientUsername] = useState('');
  const [recipientGroupId, setRecipientGroupId] = useState('');

  // Password & Expiry
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [expiryDays, setExpiryDays] = useState<number | null>(14);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isTransferModalOpen && step !== 'success') {
      setError(null);
      if (currentUser?.friends && currentUser.friends.length > 0) {
        setRecipientUsername(currentUser.friends[0]);
      }
      if (groups && groups.length > 0) {
        setRecipientGroupId(groups[0].id);
      }
    }
  }, [isTransferModalOpen]);

  if (!isTransferModalOpen || !currentUser) return null;

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        const newFile: TransferFile = {
          id: `up-${Date.now()}-${idx}`,
          name: file.name,
          url,
          size: `${sizeMb} MB`,
          type: file.type || 'application/octet-stream',
          folderPath: file.webkitRelativePath ? file.webkitRelativePath.split('/')[0] : 'Assets',
        };
        setUploadedFiles(prev => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (uploadedFiles.length === 0) {
      setError('Please add at least one file or folder to transfer.');
      return;
    }

    if (!transferTitle.trim()) {
      setError('Transfer title is required.');
      return;
    }

    if (recipientType === 'friend' && !recipientUsername.trim()) {
      setError('Please choose a friend recipient.');
      return;
    }

    if (recipientType === 'group' && !recipientGroupId) {
      setError('Please select a target friend group.');
      return;
    }

    const selectedGroup = groups.find(g => g.id === recipientGroupId);

    const res = sendTransfer({
      senderId: currentUser.id,
      senderUsername: currentUser.username,
      title: transferTitle.trim(),
      note: transferNote.trim() || undefined,
      recipientType: recipientType === 'group' ? 'group' : recipientType === 'friend' ? 'username' : 'direct-link',
      recipientUsername: recipientType === 'friend' ? recipientUsername : undefined,
      recipientGroupId: recipientType === 'group' ? recipientGroupId : undefined,
      recipientGroupName: recipientType === 'group' ? selectedGroup?.name : undefined,
      password: hasPassword && password ? password : undefined,
      expiryDays,
      files: uploadedFiles,
    });

    if (res.success && res.packageId) {
      setCreatedPackageId(res.packageId);
      setStep('success');
    } else {
      setError(res.error || 'Failed to dispatch transfer.');
    }
  };

  const transferLink = createdPackageId
    ? `${window.location.origin}${window.location.pathname}?transfer=${createdPackageId}`
    : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transferLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCloseModal = () => {
    setIsTransferModalOpen(false);
    setStep('configure');
    setCreatedPackageId(null);
    setUploadedFiles([]);
  };

  const totalSize = uploadedFiles.reduce((acc, f) => acc + (parseFloat(f.size) || 1), 0).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#383a40] bg-[#2b2d31] p-6 sm:p-8 shadow-2xl text-white">
        <button
          onClick={handleCloseModal}
          className="absolute right-4 top-4 rounded-xl border border-[#383a40] p-1.5 text-neutral-400 hover:text-white hover:bg-[#313338] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {step === 'configure' ? (
          <div>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--color-accent, #5865f2)' }} />
                <span className="font-mono-code text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  NEW FILE & FOLDER DISPATCH
                </span>
              </div>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
                Send Files / Folders
              </h2>
              <p className="mt-1 text-xs text-neutral-400">
                Package directories or files for instant delivery to friends, custom groups, or via shareable link.
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-5">
              {/* Title & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono-code text-[11px] uppercase tracking-wider text-neutral-300 font-bold mb-1">
                    Transfer Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={transferTitle}
                    onChange={e => setTransferTitle(e.target.value)}
                    className="w-full rounded-xl border border-[#383a40] bg-[#1e1f22] py-2 px-3 text-xs text-white focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </div>

                <div>
                  <label className="block font-mono-code text-[11px] uppercase tracking-wider text-neutral-300 font-bold mb-1">
                    Note for Recipients
                  </label>
                  <input
                    type="text"
                    placeholder="Optional message..."
                    value={transferNote}
                    onChange={e => setTransferNote(e.target.value)}
                    className="w-full rounded-xl border border-[#383a40] bg-[#1e1f22] py-2 px-3 text-xs text-white focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </div>
              </div>

              {/* File / Folder Upload Area */}
              <div>
                <label className="block font-mono-code text-[11px] uppercase tracking-wider text-neutral-300 font-bold mb-1.5">
                  Package Contents ({uploadedFiles.length} files • {totalSize} MB)
                </label>

                <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#383a40] bg-[#1e1f22] rounded-2xl p-6 text-center hover:border-neutral-500 transition-colors">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-white mb-2 shadow-sm"
                    style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                  >
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-white">
                    Select files or an entire folder directory
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Any format: archives (.zip, .tar), documents (.pdf), raw assets, software bundles
                  </p>

                  <div className="mt-3 flex gap-3">
                    <label className="flex items-center gap-1.5 rounded-xl border border-[#383a40] bg-[#2b2d31] hover:bg-[#313338] px-3.5 py-1.5 text-xs font-semibold cursor-pointer transition-colors shadow-sm">
                      <File className="h-3.5 w-3.5" style={{ color: 'var(--color-accent)' }} />
                      <span>Add Files</span>
                      <input type="file" multiple onChange={handleFileUpload} className="hidden" />
                    </label>

                    <label className="flex items-center gap-1.5 rounded-xl border border-[#383a40] bg-[#2b2d31] hover:bg-[#313338] px-3.5 py-1.5 text-xs font-semibold cursor-pointer transition-colors shadow-sm">
                      <Folder className="h-3.5 w-3.5" style={{ color: 'var(--color-accent)' }} />
                      <span>Add Full Folder</span>
                      {/* @ts-ignore */}
                      <input
                        type="file"
                        // @ts-expect-error webkitdirectory
                        webkitdirectory=""
                        directory=""
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto space-y-1 rounded-xl border border-[#383a40] bg-[#1e1f22] p-2">
                    {uploadedFiles.map(f => (
                      <div key={f.id} className="flex items-center justify-between font-mono-code text-[11px] p-1.5 rounded-lg bg-[#2b2d31] text-neutral-300">
                        <span className="truncate max-w-[320px]">{f.name}</span>
                        <span className="text-neutral-500">{f.size}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recipient Selector (Link, Friend, Group) */}
              <div className="rounded-2xl border border-[#383a40] bg-[#1e1f22] p-4 space-y-3">
                <label className="block font-mono-code text-[11px] uppercase tracking-wider text-neutral-300 font-bold">
                  Recipient Destination
                </label>

                <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setRecipientType('direct-link')}
                    className={`py-2 px-3 rounded-xl border transition-all ${
                      recipientType === 'direct-link'
                        ? 'border-[var(--color-accent)] bg-[#2b2d31] text-white shadow-sm'
                        : 'border-[#383a40] bg-[#232428] text-neutral-400 hover:text-white'
                    }`}
                  >
                    Shareable Link
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecipientType('friend')}
                    className={`py-2 px-3 rounded-xl border transition-all ${
                      recipientType === 'friend'
                        ? 'border-[var(--color-accent)] bg-[#2b2d31] text-white shadow-sm'
                        : 'border-[#383a40] bg-[#232428] text-neutral-400 hover:text-white'
                    }`}
                  >
                    To Friend
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecipientType('group')}
                    className={`py-2 px-3 rounded-xl border transition-all ${
                      recipientType === 'group'
                        ? 'border-[var(--color-accent)] bg-[#2b2d31] text-white shadow-sm'
                        : 'border-[#383a40] bg-[#232428] text-neutral-400 hover:text-white'
                    }`}
                  >
                    To Group
                  </button>
                </div>

                {recipientType === 'friend' && (
                  <div className="pt-2">
                    <label className="block font-mono-code text-[10px] uppercase text-neutral-400 mb-1">
                      Choose Friend Recipient:
                    </label>
                    <select
                      value={recipientUsername}
                      onChange={e => setRecipientUsername(e.target.value)}
                      className="w-full rounded-xl border border-[#383a40] bg-[#2b2d31] py-2 px-3 font-mono-code text-xs text-white focus:outline-none focus:border-[var(--color-accent)]"
                    >
                      <option value="">Select friend...</option>
                      {(currentUser.friends || []).map(f => (
                        <option key={f} value={f}>
                          @{f}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {recipientType === 'group' && (
                  <div className="pt-2">
                    <label className="block font-mono-code text-[10px] uppercase text-neutral-400 mb-1">
                      Choose Friend Group (Requirement 4.8 & 4.9):
                    </label>
                    {groups.length === 0 ? (
                      <div className="p-3 rounded-xl bg-[#2b2d31] border border-[#383a40] text-xs text-neutral-400 font-mono-code">
                        No groups created yet. Create a group in the Friends & Groups tab first!
                      </div>
                    ) : (
                      <select
                        value={recipientGroupId}
                        onChange={e => setRecipientGroupId(e.target.value)}
                        className="w-full rounded-xl border border-[#383a40] bg-[#2b2d31] py-2 px-3 font-mono-code text-xs text-white focus:outline-none focus:border-[var(--color-accent)]"
                      >
                        <option value="">Select target friend group...</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>
                            {g.name} ({g.memberUsernames.length} members: {g.memberUsernames.join(', ')})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              {/* Password & Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-[#383a40] bg-[#1e1f22] p-4">
                <div>
                  <label className="flex items-center gap-2 font-mono-code text-[11px] uppercase tracking-wider text-neutral-300 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasPassword}
                      onChange={e => setHasPassword(e.target.checked)}
                      className="rounded accent-[var(--color-accent)]"
                    />
                    <span>Require Password</span>
                  </label>
                  {hasPassword && (
                    <input
                      type="text"
                      placeholder="Enter passkey..."
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#383a40] bg-[#2b2d31] py-1.5 px-3 font-mono-code text-xs text-white focus:outline-none focus:border-[var(--color-accent)]"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-mono-code text-[11px] uppercase tracking-wider text-neutral-300 font-bold mb-1">
                    Expiration Window
                  </label>
                  <select
                    value={expiryDays === null ? 'never' : String(expiryDays)}
                    onChange={e => setExpiryDays(e.target.value === 'never' ? null : Number(e.target.value))}
                    className="w-full rounded-xl border border-[#383a40] bg-[#2b2d31] py-1.5 px-3 font-mono-code text-xs text-white focus:outline-none focus:border-[var(--color-accent)]"
                  >
                    <option value="7">Expires in 7 days</option>
                    <option value="14">Expires in 14 days (Recommended)</option>
                    <option value="30">Expires in 30 days</option>
                    <option value="never">Never expires</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all active:scale-95"
                style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
              >
                <Send className="h-4 w-4" />
                <span>Dispatch File Package</span>
              </button>
            </form>
          </div>
        ) : (
          /* Success Screen */
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg">
              <Check className="h-6 w-6" />
            </div>

            <h2 className="text-2xl font-bold text-white">
              Package Dispatched Successfully
            </h2>
            <p className="mt-1 font-mono-code text-xs text-neutral-400">
              Reference: <strong className="text-white">{createdPackageId}</strong>
            </p>

            <div className="mt-5 rounded-2xl border border-[#383a40] bg-[#1e1f22] p-4 text-left">
              <label className="block font-mono-code text-[10px] uppercase text-neutral-400 mb-1">
                Recipient Download Link:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={transferLink}
                  className="w-full rounded-xl border border-[#383a40] bg-[#2b2d31] py-2 px-3 font-mono-code text-xs text-white select-all focus:outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-white shrink-0 shadow-sm"
                  style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                >
                  {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => {
                  if (createdPackageId) {
                    setIsTransferModalOpen(false);
                    setActiveTransferPortalId(createdPackageId);
                  }
                }}
                className="rounded-xl border border-[#383a40] bg-[#2b2d31] px-4 py-2 text-xs font-semibold text-neutral-200 hover:bg-[#313338]"
              >
                Open Recipient Portal
              </button>
              <button
                onClick={() => {
                  setIsTransferModalOpen(false);
                  setActiveTab('transfers');
                }}
                className="rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
              >
                Go to Transfers Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
