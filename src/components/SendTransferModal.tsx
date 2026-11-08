import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Project, TransferFile, Photo } from '../types';
import {
  X,
  Send,
  Folder,
  FileImage,
  Upload,
  Lock,
  Calendar,
  Check,
  Copy,
  ExternalLink,
  Shield,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const SendTransferModal: React.FC = () => {
  const {
    currentUser,
    isTransferModalOpen,
    setIsTransferModalOpen,
    preselectedTransferProject,
    projects,
    photos,
    users,
    sendTransfer,
    setActiveTransferPortalId,
    setActiveTab,
    theme,
  } = useApp();

  const isLight = theme === 'light';

  // Mode: 'configure' | 'success'
  const [step, setStep] = useState<'configure' | 'success'>('configure');
  const [createdPackageId, setCreatedPackageId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State
  const [transferTitle, setTransferTitle] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [sourceType, setSourceType] = useState<'project' | 'files' | 'upload'>('project');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<TransferFile[]>([]);

  // Recipient details
  const [recipientType, setRecipientType] = useState<'username' | 'direct-link' | 'email'>('username');
  const [recipientUsername, setRecipientUsername] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');

  // Security & Expiry
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [expiryDays, setExpiryDays] = useState<number | null>(14);
  const [error, setError] = useState<string | null>(null);

  // User's own projects and photos
  const userProjects = projects.filter(p => p.userId === currentUser?.id);
  const userPhotos = photos.filter(p => p.userId === currentUser?.id);

  // Initialize form state when opened
  useEffect(() => {
    if (isTransferModalOpen && step !== 'success') {
      setError(null);
      if (preselectedTransferProject) {
        setSourceType('project');
        setSelectedProjectId(preselectedTransferProject.id);
        setTransferTitle(`${preselectedTransferProject.title} — Archival Transfer`);
        setTransferNote(preselectedTransferProject.clientDeliveryNotes || 'High resolution folder delivery for client proofing.');
      } else if (userProjects.length > 0) {
        setSelectedProjectId(userProjects[0].id);
        setTransferTitle(`${userProjects[0].title} — Archival Delivery`);
        setTransferNote('High-resolution client delivery package.');
      } else {
        setSourceType('files');
        setTransferTitle('Archival Photography Delivery');
        setTransferNote('Curated monochrome proof files.');
      }

      // Default recipient to another user if available
      const otherUser = users.find(u => u.id !== currentUser?.id);
      if (otherUser) {
        setRecipientUsername(otherUser.username);
      }
    }
  }, [isTransferModalOpen]);

  if (!isTransferModalOpen || !currentUser) return null;

  // Handle local disk file upload
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
          type: file.type || 'image/jpeg',
          folderPath: 'Uploaded_Assets',
        };
        setUploadedFiles(prev => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });
  };

  const toggleSelectPhoto = (id: string) => {
    setSelectedPhotoIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Compile final files list
  const getTransferFiles = (): TransferFile[] => {
    if (sourceType === 'project') {
      const proj = projects.find(p => p.id === selectedProjectId);
      const projPhotos = photos.filter(p => p.projectId === selectedProjectId);
      return projPhotos.map(p => ({
        id: p.id,
        name: `${p.title.toLowerCase().replace(/\s+/g, '_')}.jpg`,
        url: p.url,
        size: p.fileSize || '16.0 MB',
        type: 'image/jpeg',
        folderPath: proj?.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Portfolio_Folder',
      }));
    } else if (sourceType === 'files') {
      return photos
        .filter(p => selectedPhotoIds.includes(p.id))
        .map(p => ({
          id: p.id,
          name: `${p.title.toLowerCase().replace(/\s+/g, '_')}.jpg`,
          url: p.url,
          size: p.fileSize || '16.0 MB',
          type: 'image/jpeg',
          folderPath: 'Curated_Selection',
        }));
    } else {
      return uploadedFiles;
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const compiledFiles = getTransferFiles();

    if (compiledFiles.length === 0) {
      setError('Please select at least one photograph or file to transfer');
      return;
    }

    if (!transferTitle.trim()) {
      setError('Transfer package title is required');
      return;
    }

    if (recipientType === 'username' && !recipientUsername.trim()) {
      setError('Please provide a recipient username');
      return;
    }

    const res = sendTransfer({
      senderId: currentUser.id,
      senderUsername: currentUser.username,
      title: transferTitle,
      note: transferNote,
      recipientType,
      recipientUsername: recipientType === 'username' ? recipientUsername : undefined,
      recipientEmail: recipientType === 'email' ? recipientEmail : undefined,
      password: hasPassword ? password : undefined,
      expiryDays,
      files: compiledFiles,
    });

    if (res.success && res.packageId) {
      setCreatedPackageId(res.packageId);
      setStep('success');
    } else {
      setError(res.error || 'Failed to dispatch transfer');
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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className={`relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border p-6 sm:p-8 shadow-2xl transition-colors ${
        isLight
          ? 'bg-amber-50/95 border-amber-300 text-stone-900 shadow-orange-500/10'
          : 'bg-[#140b07] border-orange-500/30 text-white shadow-2xl shadow-orange-950/60'
      }`}>
        {/* Halloween ambient glows */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleCloseModal}
          className={`absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
            isLight
              ? 'border-amber-300 text-stone-500 hover:bg-amber-100 hover:text-stone-900'
              : 'border-orange-500/30 text-neutral-400 hover:bg-[#20110a] hover:text-[#ff6b00]'
          }`}
        >
          <X className="h-4 w-4" />
        </button>

        {step === 'configure' ? (
          <div>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#ff6b00] animate-pulse" />
                <span className="font-mono-code text-[10px] tracking-widest text-[#ff6b00] font-bold uppercase">
                  🎃 DISPATCH ENCRYPTED ARCHIVE
                </span>
              </div>
              <h2 className="mt-1 font-sans text-2xl font-bold tracking-tight">
                Send Files / Folder to Recipient
              </h2>
              <p className={`mt-1 font-sans text-xs ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
                Package high-resolution imagery into a secured, client-ready download vault with optional expiration and delivery password.
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-500">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-5">
              {/* Transfer Title & Notes */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={`block font-mono-code text-[11px] uppercase tracking-wider font-semibold ${
                    isLight ? 'text-stone-700' : 'text-neutral-300'
                  }`}>
                    Transfer Package Title <span className="text-[#ff6b00]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={transferTitle}
                    onChange={e => setTransferTitle(e.target.value)}
                    aria-label="Transfer Package Title"
                    className={`mt-1 w-full rounded-xl border py-2 px-3 text-xs focus:border-[#ff6b00] focus:outline-none transition-colors ${
                      isLight ? 'bg-white border-amber-300 text-stone-900' : 'bg-[#1b0e08] border-orange-500/30 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-mono-code text-[11px] uppercase tracking-wider font-semibold ${
                    isLight ? 'text-stone-700' : 'text-neutral-300'
                  }`}>
                    Delivery Note
                  </label>
                  <input
                    type="text"
                    value={transferNote}
                    onChange={e => setTransferNote(e.target.value)}
                    aria-label="Delivery Note"
                    className={`mt-1 w-full rounded-xl border py-2 px-3 text-xs focus:border-[#ff6b00] focus:outline-none transition-colors ${
                      isLight ? 'bg-white border-amber-300 text-stone-900' : 'bg-[#1b0e08] border-orange-500/30 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Source Selection Tabs */}
              <div>
                <label className={`block font-mono-code text-[11px] uppercase tracking-wider font-semibold mb-1.5 ${
                  isLight ? 'text-stone-700' : 'text-neutral-300'
                }`}>
                  Package Contents Source
                </label>
                <div className={`grid grid-cols-3 rounded-full border p-1 font-mono-code text-xs ${
                  isLight ? 'bg-amber-100/70 border-amber-300' : 'bg-[#1f1008] border-orange-500/30'
                }`}>
                  <button
                    type="button"
                    onClick={() => setSourceType('project')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-full transition-all font-medium ${
                      sourceType === 'project'
                        ? 'bg-[#ff6b00] text-black font-bold shadow-sm'
                        : isLight
                        ? 'text-stone-600 hover:text-stone-900'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Folder className="h-3.5 w-3.5" />
                    <span>Project Folder</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType('files')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-full transition-all font-medium ${
                      sourceType === 'files'
                        ? 'bg-[#ff6b00] text-black font-bold shadow-sm'
                        : isLight
                        ? 'text-stone-600 hover:text-stone-900'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <FileImage className="h-3.5 w-3.5" />
                    <span>Pick Photos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType('upload')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-full transition-all font-medium ${
                      sourceType === 'upload'
                        ? 'bg-[#ff6b00] text-black font-bold shadow-sm'
                        : isLight
                        ? 'text-stone-600 hover:text-stone-900'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Local</span>
                  </button>
                </div>

                {/* Sub-panels depending on source */}
                <div className={`mt-3 rounded-xl border p-4 ${
                  isLight ? 'border-amber-200 bg-amber-50/60' : 'border-orange-500/20 bg-[#180e0a]'
                }`}>
                  {sourceType === 'project' && (
                    <div>
                      <p className={`font-mono-code text-[11px] mb-2 ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
                        Select an album folder to deliver in full:
                      </p>
                      {userProjects.length === 0 ? (
                        <p className={`text-xs ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
                          You do not have any projects yet. Create one or switch to 'Pick Photos' or 'Upload Local'.
                        </p>
                      ) : (
                        <select
                          value={selectedProjectId}
                          onChange={e => setSelectedProjectId(e.target.value)}
                          className={`w-full rounded-xl border py-2 px-3 font-mono-code text-xs focus:border-[#ff6b00] focus:outline-none transition-colors ${
                            isLight ? 'bg-white border-amber-300 text-stone-900' : 'bg-[#1b0e08] border-orange-500/30 text-white'
                          }`}
                        >
                          {userProjects.map(p => {
                            const count = photos.filter(ph => ph.projectId === p.id).length;
                            return (
                              <option key={p.id} value={p.id}>
                                📁 {p.title} ({count} photos • {p.category})
                              </option>
                            );
                          })}
                        </select>
                      )}
                    </div>
                  )}

                  {sourceType === 'files' && (
                    <div>
                      <p className={`font-mono-code text-[11px] mb-2 ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
                        Check the individual works to bundle ({selectedPhotoIds.length} selected):
                      </p>
                      <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                        {photos.map(p => {
                          const isSelected = selectedPhotoIds.includes(p.id);
                          return (
                            <div
                              key={p.id}
                              onClick={() => toggleSelectPhoto(p.id)}
                              className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-colors ${
                                isSelected
                                  ? 'border-[#ff6b00] bg-orange-950/40 text-orange-200'
                                  : isLight
                                  ? 'border-amber-200 bg-white hover:border-amber-300'
                                  : 'border-orange-500/20 bg-[#140b07] hover:border-orange-500/40'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <img
                                  src={p.url}
                                  alt={p.title}
                                  className="h-8 w-8 rounded-lg grayscale object-cover"
                                />
                                <div>
                                  <p className={`text-xs font-semibold ${isLight ? 'text-stone-900' : 'text-white'}`}>{p.title}</p>
                                  <p className={`font-mono-code text-[10px] ${isLight ? 'text-stone-500' : 'text-neutral-400'}`}>
                                    {p.exif.camera || 'Leica'} • {p.fileSize || '14 MB'}
                                  </p>
                                </div>
                              </div>
                              <div
                                className={`h-4 w-4 rounded flex items-center justify-center border ${
                                  isSelected ? 'border-[#ff6b00] bg-[#ff6b00] text-black font-bold' : 'border-stone-300 dark:border-neutral-700'
                                }`}
                              >
                                {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {sourceType === 'upload' && (
                    <div>
                      <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                        isLight ? 'border-amber-300 bg-white hover:border-amber-500' : 'border-orange-500/40 bg-[#140b07] hover:border-[#ff6b00]'
                      }`}>
                        <Upload className="h-6 w-6 text-[#ff6b00] mb-2" />
                        <span className={`font-mono-code text-xs font-semibold ${isLight ? 'text-stone-900' : 'text-white'}`}>
                          Select raw or export image files from your computer
                        </span>
                        <span className={`font-mono-code text-[10px] mt-1 ${isLight ? 'text-stone-500' : 'text-neutral-400'}`}>
                          JPG, PNG, TIFF, or WebP
                        </span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>

                      {uploadedFiles.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className={`font-mono-code text-[10px] uppercase font-semibold ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
                            Staged for transfer ({uploadedFiles.length} files):
                          </p>
                          {uploadedFiles.map(f => (
                            <div
                              key={f.id}
                              className={`flex items-center justify-between p-2 rounded-lg font-mono-code text-[11px] border ${
                                isLight ? 'border-amber-200 bg-white text-stone-800' : 'border-orange-500/20 bg-[#1c0f0a] text-neutral-300'
                              }`}
                            >
                              <span className="truncate max-w-[280px]">{f.name}</span>
                              <span className={isLight ? 'text-stone-500' : 'text-neutral-400'}>{f.size}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Recipient Details */}
              <div className={`rounded-xl border p-4 ${
                isLight ? 'border-amber-200 bg-amber-50/60' : 'border-orange-500/20 bg-[#180e0a]'
              }`}>
                <label className={`block font-mono-code text-[11px] uppercase tracking-wider font-semibold mb-2 ${
                  isLight ? 'text-stone-700' : 'text-neutral-300'
                }`}>
                  Recipient Destination
                </label>
                <div className="grid grid-cols-3 gap-2 font-mono-code text-xs mb-3">
                  <button
                    type="button"
                    onClick={() => setRecipientType('username')}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                      recipientType === 'username'
                        ? 'border-[#ff6b00] bg-[#ff6b00] text-black font-bold shadow-sm'
                        : isLight
                        ? 'border-amber-200 bg-white text-stone-600 hover:text-stone-900'
                        : 'border-orange-500/20 bg-[#1c0f0a] text-neutral-400 hover:text-white'
                    }`}
                  >
                    Registered User
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientType('direct-link')}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                      recipientType === 'direct-link'
                        ? 'border-[#ff6b00] bg-[#ff6b00] text-black font-bold shadow-sm'
                        : isLight
                        ? 'border-amber-200 bg-white text-stone-600 hover:text-stone-900'
                        : 'border-orange-500/20 bg-[#1c0f0a] text-neutral-400 hover:text-white'
                    }`}
                  >
                    Shareable Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientType('email')}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                      recipientType === 'email'
                        ? 'border-[#ff6b00] bg-[#ff6b00] text-black font-bold shadow-sm'
                        : isLight
                        ? 'border-amber-200 bg-white text-stone-600 hover:text-stone-900'
                        : 'border-orange-500/20 bg-[#1c0f0a] text-neutral-400 hover:text-white'
                    }`}
                  >
                    Client Email
                  </button>
                </div>

                {recipientType === 'username' && (
                  <div>
                    <label className={`block font-mono-code text-[10px] uppercase font-semibold mb-1 ${
                      isLight ? 'text-stone-600' : 'text-neutral-400'
                    }`}>
                      Recipient Username on Platform:
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono-code text-xs text-[#ff6b00]">
                          @
                        </span>
                        <input
                          type="text"
                          value={recipientUsername}
                          onChange={e => setRecipientUsername(e.target.value.toLowerCase())}
                          aria-label="Recipient username"
                          className={`w-full rounded-xl border py-1.5 pl-6 pr-3 font-mono-code text-xs focus:border-[#ff6b00] focus:outline-none transition-colors ${
                            isLight ? 'bg-white border-amber-300 text-stone-900' : 'bg-[#1b0e08] border-orange-500/30 text-white'
                          }`}
                        />
                      </div>
                      {/* Quick recipient picker badge */}
                      <select
                        onChange={e => setRecipientUsername(e.target.value)}
                        className={`rounded-xl border px-3 font-mono-code text-xs focus:outline-none ${
                          isLight ? 'bg-white border-amber-300 text-stone-700' : 'bg-[#1b0e08] border-orange-500/30 text-neutral-300'
                        }`}
                      >
                        <option value="">Or pick member...</option>
                        {users.map(u => (
                          <option key={u.id} value={u.username}>
                            @{u.username}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {recipientType === 'email' && (
                  <div>
                    <label className={`block font-mono-code text-[10px] uppercase font-semibold mb-1 ${
                      isLight ? 'text-stone-600' : 'text-neutral-400'
                    }`}>
                      Client Email Address:
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={e => setRecipientEmail(e.target.value)}
                      aria-label="Client Email Address"
                      className={`w-full rounded-xl border py-1.5 px-3 font-mono-code text-xs focus:border-[#ff6b00] focus:outline-none transition-colors ${
                        isLight ? 'bg-white border-amber-300 text-stone-900' : 'bg-[#1b0e08] border-orange-500/30 text-white'
                      }`}
                    />
                  </div>
                )}

                {recipientType === 'direct-link' && (
                  <p className={`font-mono-code text-[11px] ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
                    A unique, secure web link will be generated. Anyone with the link (and optional password) can access and download the files.
                  </p>
                )}
              </div>

              {/* Password Protection & Expiration */}
              <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-xl border p-4 ${
                isLight ? 'border-amber-200 bg-amber-50/60' : 'border-orange-500/20 bg-[#180e0a]'
              }`}>
                {/* Password Protection */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className={`flex items-center gap-2 font-mono-code text-[11px] uppercase tracking-wider font-semibold cursor-pointer ${
                      isLight ? 'text-stone-700' : 'text-neutral-300'
                    }`}>
                      <input
                        type="checkbox"
                        checked={hasPassword}
                        onChange={e => setHasPassword(e.target.checked)}
                        className="rounded accent-[#ff6b00]"
                      />
                      <span>Require Password</span>
                    </label>
                  </div>
                  {hasPassword && (
                    <input
                      type="text"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      aria-label="Client transfer password"
                      className={`mt-2 w-full rounded-xl border py-1.5 px-3 font-mono-code text-xs focus:border-[#ff6b00] focus:outline-none transition-colors ${
                        isLight ? 'bg-white border-amber-300 text-stone-900' : 'bg-[#1b0e08] border-orange-500/30 text-white'
                      }`}
                    />
                  )}
                </div>

                {/* Expiration */}
                <div>
                  <label className={`block font-mono-code text-[11px] uppercase tracking-wider font-semibold ${
                    isLight ? 'text-stone-700' : 'text-neutral-300'
                  }`}>
                    Link Expiration Window
                  </label>
                  <select
                    value={expiryDays === null ? 'never' : String(expiryDays)}
                    onChange={e => setExpiryDays(e.target.value === 'never' ? null : Number(e.target.value))}
                    className={`mt-2 w-full rounded-xl border py-1.5 px-3 font-mono-code text-xs focus:border-[#ff6b00] focus:outline-none transition-colors ${
                      isLight ? 'bg-white border-amber-300 text-stone-900' : 'bg-[#1b0e08] border-orange-500/30 text-white'
                    }`}
                  >
                    <option value="7">Expires in 7 days</option>
                    <option value="14">Expires in 14 days (Recommended)</option>
                    <option value="30">Expires in 30 days</option>
                    <option value="never">Never expires (Permanent)</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6b00] py-3 text-xs font-bold uppercase tracking-wider text-black shadow-lg shadow-[#ff6b00]/25 transition-all hover:bg-[#e05e00] active:scale-[0.99]"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Create & Dispatch Transfer Package</span>
              </button>
            </form>
          </div>
        ) : (
          /* Success Screen */
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ff6b00] text-black shadow-lg shadow-orange-500/30">
              <Check className="h-7 w-7" />
            </div>

            <div className="flex items-center justify-center gap-2">
              <span className="font-mono-code text-[10px] tracking-widest text-[#ff6b00] font-bold uppercase">
                ✦ VAULT ARCHIVE DISPATCHED
              </span>
            </div>
            <h2 className="mt-1 font-sans text-2xl font-bold tracking-tight">
              Files Delivered Successfully
            </h2>
            <p className={`mt-2 font-mono-code text-xs max-w-md mx-auto ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
              Transfer Reference <span className="text-[#ff6b00] font-bold">{createdPackageId}</span> has been logged to your outbox and is ready for recipient access.
            </p>

            {/* Shareable Link Box */}
            <div className={`mt-6 rounded-xl border p-4 text-left ${
              isLight ? 'border-amber-300 bg-white' : 'border-orange-500/30 bg-[#1b0e08]'
            }`}>
              <label className={`block font-mono-code text-[10px] uppercase font-semibold mb-1 ${
                isLight ? 'text-stone-600' : 'text-neutral-400'
              }`}>
                Recipient Download Link:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={transferLink}
                  className={`w-full rounded-lg border py-2 px-3 font-mono-code text-xs focus:outline-none select-all ${
                    isLight ? 'border-amber-200 bg-amber-50/50 text-stone-900' : 'border-orange-500/20 bg-black/60 text-neutral-200'
                  }`}
                />
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 rounded-lg bg-[#ff6b00] px-3.5 py-2 text-xs font-bold uppercase text-black transition-colors hover:bg-[#e05e00]"
                >
                  {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {hasPassword && (
                <p className="mt-2 font-mono-code text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Protected by password: <span className="font-bold text-[#ff6b00]">{password}</span>
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                onClick={() => {
                  if (createdPackageId) {
                    setIsTransferModalOpen(false);
                    setActiveTransferPortalId(createdPackageId);
                  }
                }}
                className={`flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 font-mono-code text-xs transition-colors ${
                  isLight
                    ? 'border-amber-300 bg-white text-stone-800 hover:bg-amber-100'
                    : 'border-orange-500/30 bg-[#25120a] text-[#ff6b00] hover:bg-[#341a0e]'
                }`}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open Recipient Vault</span>
              </button>

              <button
                onClick={() => {
                  setIsTransferModalOpen(false);
                  setActiveTab('transfers');
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#ff6b00] px-4 py-2.5 font-mono-code text-xs font-bold text-black shadow-md shadow-[#ff6b00]/25 transition-all hover:bg-[#e05e00]"
              >
                <span>View Transfers Dashboard</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
