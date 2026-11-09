import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from './UserAvatar';
import {
  X,
  Users,
  Check,
  Trash2,
  Clock,
  Inbox,
  Send,
  AlertCircle,
  UserCheck,
} from 'lucide-react';

interface FriendRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FriendRequestsModal: React.FC<FriendRequestsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentUser,
    friendRequests,
    users,
    acceptFriendRequestAction,
    declineFriendRequestAction,
    cancelFriendRequestAction,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'incoming' | 'sent'>('incoming');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Keyboard escape handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !currentUser) return null;

  const incomingRequests = friendRequests.filter(
    r =>
      r.toUsername.toLowerCase() === currentUser.username.toLowerCase() &&
      r.status === 'pending'
  );

  const sentRequests = friendRequests.filter(
    r =>
      r.fromUsername.toLowerCase() === currentUser.username.toLowerCase() &&
      r.status === 'pending'
  );

  const handleAccept = (requestId: string, fromUsername: string) => {
    acceptFriendRequestAction(requestId);
    setFeedback(`Accepted @${fromUsername}'s friend request! You can now chat.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDecline = (requestId: string, fromUsername: string) => {
    declineFriendRequestAction(requestId);
    setFeedback(`Declined request from @${fromUsername}.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCancel = (requestId: string, toUsername: string) => {
    cancelFriendRequestAction(requestId);
    setFeedback(`Cancelled friend request to @${toUsername}.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border shadow-2xl bg-[#2b2d31] border-[#383a40] text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 border-[#383a40] bg-[#232428]">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
            >
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-sans text-base font-bold tracking-tight text-white">
                Friend Requests Hub
              </h2>
              <p className="text-[11px] text-neutral-400">
                Review incoming requests and manage sent invitations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-neutral-400 hover:bg-[#313338] hover:text-white transition-colors"
            aria-label="Close friend requests modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action Feedback Banner */}
        {feedback && (
          <div className="border-b px-6 py-2.5 font-sans text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-400 flex items-center gap-2">
            <UserCheck className="h-4 w-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex border-b px-6 pt-3 gap-6 font-mono-code text-xs border-[#383a40]">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`flex items-center gap-2 pb-3 border-b-2 font-medium transition-colors ${
              activeTab === 'incoming'
                ? 'border-[var(--color-accent,#5865f2)] text-white font-bold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Inbox className="h-3.5 w-3.5" />
            <span>Incoming</span>
            {incomingRequests.length > 0 && (
              <span
                className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
              >
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sent')}
            className={`flex items-center gap-2 pb-3 border-b-2 font-medium transition-colors ${
              activeTab === 'sent'
                ? 'border-[var(--color-accent,#5865f2)] text-white font-bold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>Sent Out</span>
            {sentRequests.length > 0 && (
              <span className="ml-1 rounded-full px-2 py-0.5 text-[10px] bg-[#1e1f22] text-neutral-300">
                {sentRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {activeTab === 'incoming' ? (
            incomingRequests.length === 0 ? (
              <div className="py-12 text-center font-mono-code text-xs text-neutral-400">
                <Inbox className="mx-auto h-8 w-8 mb-2 opacity-50 text-neutral-500" />
                <p>No incoming friend requests right now.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incomingRequests.map(req => {
                  const userDetail = users.find(u => u.username.toLowerCase() === req.fromUsername.toLowerCase());

                  return (
                    <div
                      key={req.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-[#383a40] bg-[#232428] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar username={req.fromUsername} size="md" />
                        <div className="min-w-0">
                          <p className="font-mono-code text-xs font-bold text-white">@{req.fromUsername}</p>
                          <p className="text-[11px] line-clamp-1 text-neutral-400">
                            {userDetail?.bio || 'Wants to connect on Noir Archive.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleAccept(req.id, req.fromUsername)}
                          className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-sans text-xs font-bold text-white shadow-sm hover:brightness-110 transition-all"
                          style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                        >
                          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleDecline(req.id, req.fromUsername)}
                          className="flex items-center gap-1 rounded-xl border px-3 py-1.5 font-sans text-xs border-[#383a40] text-neutral-300 hover:bg-[#313338] hover:text-rose-400 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            sentRequests.length === 0 ? (
              <div className="py-12 text-center font-mono-code text-xs text-neutral-400">
                <Send className="mx-auto h-8 w-8 mb-2 opacity-50 text-neutral-500" />
                <p>No pending friend requests sent out.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sentRequests.map(req => {
                  return (
                    <div
                      key={req.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-[#383a40] bg-[#232428] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar username={req.toUsername} size="md" />
                        <div className="min-w-0">
                          <p className="font-mono-code text-xs font-bold text-white">@{req.toUsername}</p>
                          <p className="text-[11px] line-clamp-1 text-neutral-400">
                            Invitation sent on {new Date(req.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCancel(req.id, req.toUsername)}
                        className="flex items-center gap-1 rounded-xl border px-3 py-1.5 font-sans text-xs border-[#383a40] text-neutral-300 hover:bg-[#313338] hover:text-rose-400 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Cancel Request</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-3.5 flex justify-end font-mono-code text-xs border-[#383a40] bg-[#232428]">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-1.5 font-sans text-xs font-medium bg-[#313338] text-white hover:bg-[#383a40] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
