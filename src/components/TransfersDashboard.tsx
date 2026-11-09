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
  Users,
  Folder,
} from 'lucide-react';
import { calculateTotalTransferSize } from '../utils/transfer';
import { UserAvatar } from './UserAvatar';

export const TransfersDashboard: React.FC = () => {
  const {
    currentUser,
    transfers,
    groups,
    revokeTransfer,
    setActiveTransferPortalId,
    setIsTransferModalOpen,
    setAuthModal,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'outbox' | 'inbox'>('outbox');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <Send className="mx-auto mb-4 h-12 w-12" style={{ color: 'var(--color-accent, #5865f2)' }} />
        <h2 className="text-2xl font-bold text-white">Transfers Hub</h2>
        <p className="mt-2 text-xs text-neutral-400">
          Sign in or join with a unique username to dispatch files and folders, track downloads, and share packages with friends and groups.
        </p>
        <button
          onClick={() => setAuthModal('signin')}
          className="mt-6 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:brightness-110"
          style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
        >
          Sign In to Access Transfers
        </button>
      </div>
    );
  }

  // Sent by this user
  const sentTransfers = transfers.filter(t => t.senderId === currentUser.id);

  // Received by this user (addressed to their unique username OR to a group they belong to)
  const userGroupIds = new Set(
    groups
      .filter(g => g.memberUsernames.includes(currentUser.username) || g.ownerUsername === currentUser.username)
      .map(g => g.id)
  );

  const receivedTransfers = transfers.filter(
    t =>
      (t.recipientType === 'username' && t.recipientUsername?.toLowerCase() === currentUser.username.toLowerCase()) ||
      (t.recipientType === 'group' && t.recipientGroupId && userGroupIds.has(t.recipientGroupId))
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
      <div className="mb-8 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between border-[#383a40]">
        <div>
          <div className="flex items-center gap-2 font-mono-code text-[10px] uppercase tracking-widest font-bold text-neutral-400">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
            />
            <span>TRANSFERS & DELIVERY REGISTRY</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            File & Folder Transfers
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            High-speed packages, folder archives, and direct download links for @{currentUser.username}.
          </p>
        </div>

        <button
          onClick={() => setIsTransferModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold tracking-wider text-white shadow-md hover:brightness-110 active:scale-95 transition-all"
          style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>New Transfer</span>
        </button>
      </div>

      {/* Outbox / Inbox Tabs */}
      <div className="mb-6 flex border-b font-mono-code text-xs border-[#383a40]">
        <button
          onClick={() => setActiveTab('outbox')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 uppercase tracking-wider transition-all font-semibold ${
            activeTab === 'outbox'
              ? 'border-[var(--color-accent,#5865f2)] text-white'
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
              ? 'border-[var(--color-accent,#5865f2)] text-white'
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
            <div className="border-2 border-dashed rounded-2xl p-12 text-center border-[#383a40] bg-[#2b2d31]/50 text-white">
              <Send className="mx-auto mb-3 h-8 w-8 text-neutral-400" />
              <h3 className="text-base font-bold text-white">No Dispatched Transfers</h3>
              <p className="mt-1 font-mono-code text-xs text-neutral-400">
                You haven't sent any files or folders yet.
              </p>
              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="mt-4 rounded-xl px-4 py-2 font-mono-code text-xs font-bold text-white shadow hover:brightness-110"
                style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
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
                        ? 'opacity-60 border-neutral-800 bg-[#232428]'
                        : 'border-[#383a40] bg-[#2b2d31] hover:border-[#4e5058]'
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      {/* Left: Metadata */}
                      <div>
                        <div className="flex items-center gap-2 font-mono-code text-[10px] text-neutral-400">
                          <span className="font-bold text-white">{pkg.id}</span>
                          <span>•</span>
                          <span>{new Date(pkg.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{pkg.files.length} {pkg.files.length === 1 ? 'File' : 'Files'}</span>
                          <span>•</span>
                          <span>{totalSize}</span>
                          {pkg.hasPassword && (
                            <span className="flex items-center gap-1 text-amber-400 font-bold">
                              <Lock className="h-3 w-3" /> Protected
                            </span>
                          )}
                        </div>

                        <h3 className="mt-1 text-lg font-bold text-white">
                          {pkg.title}
                        </h3>

                        {pkg.note && (
                          <p className="mt-1 font-sans text-xs italic text-neutral-300">
                            "{pkg.note}"
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-3 font-mono-code text-xs">
                          <span className="text-neutral-400">Recipient:</span>
                          <span className="font-semibold text-white">
                            {pkg.recipientType === 'group' ? (
                              <span className="inline-flex items-center gap-1 text-indigo-400">
                                <Users className="h-3.5 w-3.5" />
                                Group: {pkg.recipientGroupName || 'Friend Group'}
                              </span>
                            ) : pkg.recipientType === 'username' ? (
                              `@${pkg.recipientUsername}`
                            ) : pkg.recipientType === 'email' ? (
                              pkg.recipientEmail
                            ) : (
                              'Shareable Link'
                            )}
                          </span>

                          <span className="opacity-40">•</span>
                          <span className="text-neutral-300">
                            Downloads: <strong className="text-white">{pkg.downloadsCount}</strong>
                          </span>

                          {pkg.expiresAt && (
                            <>
                              <span className="opacity-40">•</span>
                              <span className="text-neutral-400">
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
                          className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono-code text-xs transition-colors border-[#383a40] bg-[#232428] text-neutral-200 hover:border-[#4e5058]"
                          title="Copy direct share link"
                        >
                          {copiedId === pkg.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copied</span>
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
                          className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-mono-code text-xs font-bold text-white shadow hover:brightness-110 transition-colors"
                          style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>View Vault</span>
                        </button>

                        {!isRevoked && (
                          <button
                            onClick={() => revokeTransfer(pkg.id)}
                            className="flex items-center gap-1 rounded-xl border p-1.5 transition-colors border-[#383a40] text-neutral-400 hover:border-rose-500/50 hover:text-rose-400"
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
            <div className="border-2 border-dashed rounded-2xl p-12 text-center border-[#383a40] bg-[#2b2d31]/50 text-white">
              <Inbox className="mx-auto mb-3 h-8 w-8 text-neutral-400" />
              <h3 className="text-base font-bold text-white">No Received Packages</h3>
              <p className="mt-1 font-mono-code text-xs text-neutral-400">
                When friends or groups share files or folders with you, they will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {receivedTransfers.map(pkg => {
                const totalSize = calculateTotalTransferSize(pkg.files);

                return (
                  <div
                    key={pkg.id}
                    className="rounded-2xl border p-5 transition-all shadow-sm border-[#383a40] bg-[#2b2d31] hover:border-[#4e5058]"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-3.5">
                        <UserAvatar username={pkg.senderUsername} size="md" />
                        <div>
                          <div className="flex items-center gap-2 font-mono-code text-[10px] text-neutral-400">
                            <span className="text-white font-bold">{pkg.id}</span>
                            <span>•</span>
                            <span>Sent by @{pkg.senderUsername}</span>
                            {pkg.recipientType === 'group' && (
                              <>
                                <span>•</span>
                                <span className="text-indigo-400 font-semibold flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  Group: {pkg.recipientGroupName || 'Friend Group'}
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span>{pkg.files.length} Files</span>
                            <span>•</span>
                            <span>{totalSize}</span>
                          </div>

                          <h3 className="mt-1 text-lg font-bold text-white">
                            {pkg.title}
                          </h3>

                          {pkg.note && (
                            <p className="mt-1 font-sans text-xs italic text-neutral-300">
                              "{pkg.note}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setActiveTransferPortalId(pkg.id)}
                          className="flex items-center gap-1.5 rounded-xl px-4 py-2 font-mono-code text-xs font-bold text-white hover:brightness-110 shadow transition-colors"
                          style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                        >
                          <FolderDown className="h-3.5 w-3.5" />
                          <span>Open & Download</span>
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
