import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
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
    theme,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'incoming' | 'sent'>('incoming');
  const [feedback, setFeedback] = useState<string | null>(null);

  const isLight = theme === 'light';

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

  const getUserDetails = (username: string) => {
    return users.find(u => u.username.toLowerCase() === username.toLowerCase());
  };

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
      <div
        className={`relative z-10 w-full max-w-lg rounded-2xl border shadow-2xl transition-all overflow-hidden ${
          isLight
            ? 'bg-amber-50/95 border-amber-300 text-stone-900 shadow-orange-500/10'
            : 'bg-[#140b07] border-orange-500/30 text-white shadow-2xl shadow-orange-950/60'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b px-6 py-4 ${
            isLight ? 'border-amber-200 bg-amber-50/70' : 'border-orange-500/20 bg-[#140b07]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-[#ff6b00]">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-sans text-base font-bold tracking-tight">
                Friend Requests Hub
              </h2>
              <p className={`text-[11px] ${isLight ? 'text-stone-500' : 'text-neutral-400'}`}>
                Review incoming requests and manage sent invitations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`rounded-full p-1.5 transition-colors ${
              isLight
                ? 'text-stone-400 hover:bg-amber-100 hover:text-stone-700'
                : 'text-neutral-400 hover:bg-[#22130c] hover:text-white'
            }`}
            aria-label="Close friend requests modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action Feedback Banner */}
        {feedback && (
          <div className="border-b border-orange-500/20 bg-orange-500/10 px-6 py-2.5 font-sans text-xs text-[#ff6b00] flex items-center gap-2">
            <UserCheck className="h-4 w-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Tab Selector */}
        <div
          className={`flex border-b px-6 pt-3 gap-6 font-mono-code text-xs ${
            isLight ? 'border-amber-200' : 'border-orange-500/20'
          }`}
        >
          <button
            onClick={() => setActiveTab('incoming')}
            className={`flex items-center gap-2 pb-3 border-b-2 font-medium transition-colors ${
              activeTab === 'incoming'
                ? 'border-[#ff6b00] text-[#ff6b00] font-bold'
                : `border-transparent ${isLight ? 'text-stone-500 hover:text-stone-800' : 'text-neutral-400 hover:text-white'}`
            }`}
          >
            <Inbox className="h-3.5 w-3.5" />
            <span>Incoming</span>
            {incomingRequests.length > 0 && (
              <span className="ml-1 rounded-full bg-[#ff6b00] px-2 py-0.5 text-[10px] font-bold text-black">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sent')}
            className={`flex items-center gap-2 pb-3 border-b-2 font-medium transition-colors ${
              activeTab === 'sent'
                ? 'border-[#ff6b00] text-[#ff6b00] font-bold'
                : `border-transparent ${isLight ? 'text-stone-500 hover:text-stone-800' : 'text-neutral-400 hover:text-white'}`
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>Sent Out</span>
            {sentRequests.length > 0 && (
              <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] ${
                isLight ? 'bg-amber-100 text-stone-700' : 'bg-[#22130c] text-orange-300'
              }`}>
                {sentRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {activeTab === 'incoming' ? (
            incomingRequests.length === 0 ? (
              <div className="py-12 text-center font-mono-code text-xs opacity-60">
                <Inbox className="mx-auto h-8 w-8 mb-2 opacity-50 text-orange-400" />
                <p>No incoming friend requests right now.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incomingRequests.map(req => {
                  const userDetail = users.find(u => u.username.toLowerCase() === req.fromUsername.toLowerCase());

                  return (
                    <div
                      key={req.id}
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-colors ${
                        isLight ? 'border-amber-200 bg-amber-50/40' : 'border-orange-500/20 bg-[#160d09]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={userDetail?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                          alt={req.fromUsername}
                          className="h-10 w-10 rounded-full object-cover ring-1 ring-orange-500/30 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-mono-code text-xs font-bold text-[#ff6b00]">@{req.fromUsername}</p>
                          <p className={`text-[11px] line-clamp-1 ${isLight ? 'text-stone-500' : 'text-neutral-400'}`}>
                            {userDetail?.bio || 'Wants to connect and exchange portfolios.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleAccept(req.id, req.fromUsername)}
                          className="flex items-center gap-1.5 rounded-lg bg-[#ff6b00] px-3.5 py-1.5 font-sans text-xs font-bold text-black shadow-sm hover:bg-[#ff7d1f] transition-all"
                        >
                          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleDecline(req.id, req.fromUsername)}
                          className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 font-sans text-xs transition-colors ${
                            isLight
                              ? 'border-amber-300 text-stone-600 hover:bg-amber-100 hover:text-red-600'
                              : 'border-orange-500/30 text-neutral-300 hover:bg-[#22130c] hover:text-red-400'
                          }`}
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
              <div className="py-12 text-center font-mono-code text-xs opacity-60">
                <Send className="mx-auto h-8 w-8 mb-2 opacity-50 text-orange-400" />
                <p>No pending friend requests sent out.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sentRequests.map(req => {
                  const targetUser = users.find(u => u.username.toLowerCase() === req.toUsername.toLowerCase());

                  return (
                    <div
                      key={req.id}
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-colors ${
                        isLight ? 'border-amber-200 bg-amber-50/40' : 'border-orange-500/20 bg-[#160d09]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={targetUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                          alt={req.toUsername}
                          className="h-10 w-10 rounded-full object-cover ring-1 ring-orange-500/30 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-mono-code text-xs font-bold text-[#ff6b00]">@{req.toUsername}</p>
                          <p className={`text-[11px] line-clamp-1 ${isLight ? 'text-stone-500' : 'text-neutral-400'}`}>
                            Invitation sent on {new Date(req.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCancel(req.id, req.toUsername)}
                        className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 font-sans text-xs transition-colors ${
                          isLight
                            ? 'border-amber-300 text-stone-600 hover:bg-amber-100 hover:text-red-600'
                            : 'border-orange-500/30 text-neutral-300 hover:bg-[#22130c] hover:text-red-400'
                        }`}
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
        <div
          className={`border-t px-6 py-3.5 flex justify-end font-mono-code text-xs ${
            isLight ? 'border-amber-200/60 bg-amber-50/70' : 'border-orange-500/20 bg-[#160c07]'
          }`}
        >
          <button
            onClick={onClose}
            className={`rounded-xl px-4 py-1.5 font-sans text-xs font-medium transition-colors ${
              isLight
                ? 'bg-amber-200 text-stone-800 hover:bg-amber-300'
                : 'bg-[#2a170d] text-orange-200 hover:bg-[#381e12] border border-orange-500/30'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
