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
  Star,
  Search,
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
    toggleFavoriteTransferAction,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'outbox' | 'inbox' | 'favorites'>('outbox');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
          className="mt-6 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:brightness-110 cursor-pointer"
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

  // Favorited transfers
  const favoriteTransfers = transfers.filter(
    t => t.isFavorite || (currentUser.favoritePackageIds || []).includes(t.id)
  );

  const handleCopyLink = (packageId: string) => {
    const link = `${window.location.origin}${window.location.pathname}?transfer=${packageId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(packageId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filterList = (list: typeof transfers) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      t =>
        t.title.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.note && t.note.toLowerCase().includes(q)) ||
        t.files.some(f => f.name.toLowerCase().includes(q))
    );
  };

  const displayedList =
    activeTab === 'outbox'
      ? filterList(sentTransfers)
      : activeTab === 'inbox'
      ? filterList(receivedTransfers)
      : filterList(favoriteTransfers);

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
          className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold tracking-wider text-white shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>New Transfer</span>
        </button>
      </div>

      {/* Tabs and Search Bar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#383a40] pb-2">
        <div className="flex border-b sm:border-b-0 font-mono-code text-xs border-[#383a40]">
          <button
            onClick={() => setActiveTab('outbox')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 uppercase tracking-wider transition-all font-semibold cursor-pointer ${
              activeTab === 'outbox'
                ? 'border-[var(--color-accent,#5865f2)] text-white'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>Outbox ({sentTransfers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 uppercase tracking-wider transition-all font-semibold cursor-pointer ${
              activeTab === 'inbox'
                ? 'border-[var(--color-accent,#5865f2)] text-white'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Inbox className="h-3.5 w-3.5" />
            <span>Inbox ({receivedTransfers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 uppercase tracking-wider transition-all font-semibold cursor-pointer ${
              activeTab === 'favorites'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Star className="h-3.5 w-3.5" />
            <span>Favorites ({favoriteTransfers.length})</span>
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search transfers..."
            className="w-full sm:w-56 rounded-xl border border-[#383a40] bg-[#1e1f22] py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[var(--color-accent,#5865f2)]"
          />
        </div>
      </div>

      {/* List Display */}
      <div>
        {displayedList.length === 0 ? (
          <div className="border-2 border-dashed rounded-2xl p-12 text-center border-[#383a40] bg-[#2b2d31]/50 text-white">
            <Send className="mx-auto mb-3 h-8 w-8 text-neutral-400" />
            <h3 className="text-base font-bold text-white">
              {activeTab === 'outbox'
                ? 'No Dispatched Transfers'
                : activeTab === 'inbox'
                ? 'No Received Packages'
                : 'No Favorited Packages'}
            </h3>
            <p className="mt-1 font-mono-code text-xs text-neutral-400">
              {searchQuery
                ? 'No transfers match your search query.'
                : activeTab === 'outbox'
                ? "You haven't sent any files or folders yet."
                : activeTab === 'inbox'
                ? 'When friends or groups share files with you, they will appear here.'
                : 'Star any transfer package to keep it pinned in your favorites.'}
            </p>
            {activeTab === 'outbox' && !searchQuery && (
              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="mt-4 rounded-xl px-4 py-2 font-mono-code text-xs font-bold text-white shadow hover:brightness-110 cursor-pointer"
                style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
              >
                Send First Package
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayedList.map(pkg => {
              const totalSize = calculateTotalTransferSize(pkg.files);
              const isRevoked = pkg.status === 'revoked';
              const isFav = pkg.isFavorite || (currentUser.favoritePackageIds || []).includes(pkg.id);

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
                    <div className="flex items-start gap-3.5">
                      <button
                        type="button"
                        onClick={() => toggleFavoriteTransferAction(pkg.id)}
                        className={`p-2 rounded-xl border mt-0.5 transition-colors cursor-pointer ${
                          isFav
                            ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                            : 'border-[#383a40] bg-[#1e1f22] text-neutral-400 hover:text-white'
                        }`}
                        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star className={`h-4 w-4 ${isFav ? 'fill-current text-amber-400' : ''}`} />
                      </button>

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
                          <span className="text-neutral-400">
                            {pkg.senderId === currentUser.id ? 'Recipient:' : 'Sender:'}
                          </span>
                          <span className="font-semibold text-white">
                            {pkg.senderId === currentUser.id ? (
                              pkg.recipientType === 'group' ? (
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
                              )
                            ) : (
                              `@${pkg.senderUsername}`
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
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCopyLink(pkg.id)}
                        className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono-code text-xs transition-colors border-[#383a40] bg-[#232428] text-neutral-200 hover:border-[#4e5058] cursor-pointer"
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
                        className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-mono-code text-xs font-bold text-white shadow hover:brightness-110 transition-colors cursor-pointer"
                        style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>View Vault</span>
                      </button>

                      {!isRevoked && pkg.senderId === currentUser.id && (
                        <button
                          onClick={() => revokeTransfer(pkg.id)}
                          className="flex items-center gap-1 rounded-xl border p-1.5 transition-colors border-[#383a40] text-neutral-400 hover:border-rose-500/50 hover:text-rose-400 cursor-pointer"
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
    </div>
  );
};
