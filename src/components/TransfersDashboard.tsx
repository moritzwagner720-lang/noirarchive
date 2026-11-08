import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Send,
  Inbox,
  FolderDown,
  Lock,
  Calendar,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Clock,
  CheckCircle,
  FileText,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { calculateTotalTransferSize } from '../utils/transfer';

export const TransfersDashboard: React.FC = () => {
  const {
    currentUser,
    transfers,
    revokeTransfer,
    setActiveTransferPortalId,
    setIsTransferModalOpen,
    setAuthModal,
    theme,
  } = useApp();

  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'outbox' | 'inbox'>('outbox');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <Send className="mx-auto mb-4 h-12 w-12 text-[#ff6b00]" />
        <h2 className={`font-editorial text-2xl font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>Transfers Hub</h2>
        <p className={`mt-2 text-xs ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
          Sign in or join with a unique username to dispatch archival folders, manage client portals, and receive photography assets from collaborators.
        </p>
        <button
          onClick={() => setAuthModal('signin')}
          className="mt-6 rounded-lg bg-[#ff6b00] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black shadow-md hover:bg-[#ff7d1f]"
        >
          Sign In to Access Transfers
        </button>
      </div>
    );
  }

  // Sent by this user
  const sentTransfers = transfers.filter(t => t.senderId === currentUser.id);

  // Received by this user (addressed to their unique username)
  const receivedTransfers = transfers.filter(
    t => t.recipientUsername?.toLowerCase() === currentUser.username.toLowerCase()
  );

  const handleCopyLink = (packageId: string) => {
    const link = `${window.location.origin}${window.location.pathname}?transfer=${packageId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(packageId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className={`mb-8 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between transition-colors ${
        isLight ? 'border-amber-200' : 'border-orange-500/15'
      }`}>
        <div>
          <div className="flex items-center gap-2 font-mono-code text-[10px] uppercase tracking-widest text-[#ff6b00] font-bold">
            <span className="h-2 w-2 rounded-full bg-[#ff6b00]" />
            <span>DISPATCH & RECEIVE REGISTRY</span>
          </div>
          <h1 className={`mt-1 font-editorial text-2xl font-bold sm:text-3xl ${
            isLight ? 'text-stone-900' : 'text-white'
          }`}>
            Archival Transfers & Client Delivery
          </h1>
          <p className={`mt-1 text-xs ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
            Encrypted delivery packages, folder transfers, and client download tracking for @{currentUser.username}.
          </p>
        </div>

        <button
          onClick={() => setIsTransferModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#ff6b00] px-5 py-2.5 text-xs font-bold tracking-wider uppercase text-black shadow-md hover:bg-[#ff7d1f] hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>New Transfer</span>
        </button>
      </div>

      {/* Outbox / Inbox Tabs */}
      <div className={`mb-6 flex border-b font-mono-code text-xs transition-colors ${
        isLight ? 'border-amber-200' : 'border-orange-500/15'
      }`}>
        <button
          onClick={() => setActiveTab('outbox')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 uppercase tracking-wider transition-all font-semibold ${
            activeTab === 'outbox'
              ? 'border-[#ff6b00] text-[#ff6b00]'
              : isLight
              ? 'border-transparent text-stone-600 hover:text-stone-950'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Send className="h-3.5 w-3.5" />
          <span>Dispatched Outbox ({sentTransfers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 uppercase tracking-wider transition-all font-semibold ${
            activeTab === 'inbox'
              ? 'border-[#ff6b00] text-[#ff6b00]'
              : isLight
              ? 'border-transparent text-stone-600 hover:text-stone-950'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Inbox className="h-3.5 w-3.5" />
          <span>Received Inbox ({receivedTransfers.length})</span>
        </button>
      </div>

      {/* Outbox View */}
      {activeTab === 'outbox' && (
        <div>
          {sentTransfers.length === 0 ? (
            <div className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
              isLight ? 'border-amber-300 bg-amber-50/50 text-stone-900' : 'border-orange-500/20 bg-[#130b08]/40 text-white'
            }`}>
              <Send className="mx-auto mb-3 h-8 w-8 text-orange-500" />
              <h3 className="font-editorial text-base font-bold">No Dispatched Transfers</h3>
              <p className={`mt-1 font-mono-code text-xs ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
                You haven't sent any files or folders yet.
              </p>
              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="mt-4 rounded-lg bg-[#ff6b00] px-4 py-2 font-mono-code text-xs font-bold text-black hover:bg-[#ff7d1f] shadow"
              >
                Send First Package
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sentTransfers.map(pkg => {
                const totalSize = calculateTotalTransferSize(pkg.files);
                const isRevoked = pkg.status === 'revoked';

                return (
                  <div
                    key={pkg.id}
                    className={`rounded-2xl border p-5 transition-all shadow-sm ${
                      isRevoked
                        ? 'opacity-60 border-neutral-800 bg-neutral-900/30'
                        : isLight
                        ? 'border-amber-200 bg-white hover:border-amber-400'
                        : 'border-orange-500/20 bg-[#140b07] hover:border-orange-500/40'
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      {/* Left: Metadata */}
                      <div>
                        <div className={`flex items-center gap-2 font-mono-code text-[10px] ${
                          isLight ? 'text-stone-500' : 'text-neutral-400'
                        }`}>
                          <span className="font-bold text-[#ff6b00]">{pkg.id}</span>
                          <span>•</span>
                          <span>{new Date(pkg.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{pkg.files.length} Assets</span>
                          <span>•</span>
                          <span>{totalSize}</span>
                          {pkg.hasPassword && (
                            <span className="flex items-center gap-1 text-amber-500 font-bold">
                              <Lock className="h-3 w-3" /> Protected
                            </span>
                          )}
                        </div>

                        <h3 className={`mt-1 font-editorial text-lg font-bold ${
                          isLight ? 'text-stone-900' : 'text-white'
                        }`}>
                          {pkg.title}
                        </h3>

                        {pkg.note && (
                          <p className={`mt-1 font-sans text-xs italic ${
                            isLight ? 'text-stone-600' : 'text-neutral-400'
                          }`}>
                            "{pkg.note}"
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-3 font-mono-code text-xs">
                          <span className={isLight ? 'text-stone-500' : 'text-neutral-400'}>Recipient:</span>
                          <span className={`font-semibold ${isLight ? 'text-stone-900' : 'text-orange-200'}`}>
                            {pkg.recipientType === 'username'
                              ? `@${pkg.recipientUsername}`
                              : pkg.recipientType === 'email'
                              ? pkg.recipientEmail
                              : 'Shareable Link'}
                          </span>

                          <span className="opacity-40">•</span>
                          <span className={isLight ? 'text-stone-600' : 'text-neutral-300'}>
                            Downloads: <strong className={isLight ? 'text-stone-900' : 'text-white'}>{pkg.downloadsCount}</strong>
                          </span>

                          {pkg.expiresAt && (
                            <>
                              <span className="opacity-40">•</span>
                              <span className={isLight ? 'text-stone-500' : 'text-neutral-400'}>
                                Expires: {new Date(pkg.expiresAt).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleCopyLink(pkg.id)}
                          className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 font-mono-code text-xs transition-colors ${
                            isLight
                              ? 'border-amber-300 bg-amber-50 text-stone-800 hover:bg-amber-100'
                              : 'border-orange-500/30 bg-[#1e110c] text-orange-200 hover:border-orange-400'
                          }`}
                          title="Copy direct client link"
                        >
                          {copiedId === pkg.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-emerald-500 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setActiveTransferPortalId(pkg.id)}
                          className="flex items-center gap-1 rounded-lg bg-[#ff6b00] px-3.5 py-1.5 font-mono-code text-xs font-bold text-black shadow hover:bg-[#ff7d1f] transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>View Vault</span>
                        </button>

                        {!isRevoked && (
                          <button
                            onClick={() => revokeTransfer(pkg.id)}
                            className={`flex items-center gap-1 rounded-lg border p-1.5 transition-colors ${
                              isLight
                                ? 'border-red-200 text-stone-400 hover:border-red-400 hover:text-red-600'
                                : 'border-neutral-800 text-neutral-400 hover:border-red-800 hover:text-red-400'
                            }`}
                            title="Revoke access"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Inbox View */}
      {activeTab === 'inbox' && (
        <div>
          {receivedTransfers.length === 0 ? (
            <div className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
              isLight ? 'border-amber-300 bg-amber-50/50 text-stone-900' : 'border-orange-500/20 bg-[#130b08]/40 text-white'
            }`}>
              <Inbox className="mx-auto mb-3 h-8 w-8 text-orange-500" />
              <h3 className="font-editorial text-base font-bold">No Received Packages</h3>
              <p className={`mt-1 font-mono-code text-xs ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
                When other photographers send files or folders to @{currentUser.username}, they will automatically appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {receivedTransfers.map(pkg => {
                const totalSize = calculateTotalTransferSize(pkg.files);

                return (
                  <div
                    key={pkg.id}
                    className={`rounded-2xl border p-5 transition-all shadow-sm ${
                      isLight
                        ? 'border-amber-200 bg-white hover:border-amber-400'
                        : 'border-orange-500/20 bg-[#140b07] hover:border-orange-500/40'
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className={`flex items-center gap-2 font-mono-code text-[10px] ${
                          isLight ? 'text-stone-500' : 'text-neutral-400'
                        }`}>
                          <span className="text-[#ff6b00] font-bold">{pkg.id}</span>
                          <span>•</span>
                          <span>Sent by @{pkg.senderUsername}</span>
                          <span>•</span>
                          <span>{pkg.files.length} Files</span>
                          <span>•</span>
                          <span>{totalSize}</span>
                        </div>

                        <h3 className={`mt-1 font-editorial text-lg font-bold ${
                          isLight ? 'text-stone-900' : 'text-white'
                        }`}>
                          {pkg.title}
                        </h3>

                        {pkg.note && (
                          <p className={`mt-1 font-sans text-xs italic ${
                            isLight ? 'text-stone-600' : 'text-neutral-300'
                          }`}>
                            "{pkg.note}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setActiveTransferPortalId(pkg.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-[#ff6b00] px-4 py-2 font-mono-code text-xs font-bold text-black hover:bg-[#ff7d1f] shadow transition-colors"
                        >
                          <FolderDown className="h-3.5 w-3.5" />
                          <span>Open & Download Folder</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
