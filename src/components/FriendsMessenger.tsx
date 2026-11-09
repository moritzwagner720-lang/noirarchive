import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TransferFile, ChatAttachment, User, FriendGroup } from '../types';
import { UserAvatar } from './UserAvatar';
import { FriendRequestsModal } from './FriendRequestsModal';
import JSZip from 'jszip';
import {
  Users,
  UserPlus,
  Send,
  Plus,
  Folder,
  FileImage,
  Upload,
  Download,
  FileArchive,
  MessageSquare,
  Search,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Edit2,
  Trash2,
  UserMinus,
  Layers,
  Check,
  X,
  Share2,
} from 'lucide-react';

export const FriendsMessenger: React.FC = () => {
  const {
    currentUser,
    users,
    friendRequests,
    chatMessages,
    groups,
    activeGroupId,
    setActiveGroupId,
    createGroupAction,
    renameGroupAction,
    deleteGroupAction,
    addMemberToGroupAction,
    removeMemberFromGroupAction,
    sendFriendRequestAction,
    acceptFriendRequestAction,
    declineFriendRequestAction,
    sendChatMessageAction,
    activeChatFriend,
    setActiveChatFriend,
    setIsTransferModalOpen,
    searchAccountsGlobally,
  } = useApp();

  // Search & Add friend
  const [addFriendInput, setAddFriendInput] = useState('');
  const [requestFeedback, setRequestFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Group creation & editing
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedInitialFriends, setSelectedInitialFriends] = useState<string[]>([]);
  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [editGroupNameInput, setEditGroupNameInput] = useState('');
  const [addMemberInput, setAddMemberInput] = useState('');
  const [groupFeedback, setGroupFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Messaging & Attachments
  const [messageText, setMessageText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [isZipping, setIsZipping] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  if (!currentUser) return null;

  // Active group object
  const activeGroup = groups.find(g => g.id === activeGroupId) || null;

  // Friends list derived from accepted friends & chat history
  const messagePartners = Array.from(
    new Set(
      chatMessages
        .filter(
          m =>
            m.senderUsername.toLowerCase() === currentUser.username.toLowerCase() ||
            m.recipientUsername.toLowerCase() === currentUser.username.toLowerCase()
        )
        .map(m =>
          m.senderUsername.toLowerCase() === currentUser.username.toLowerCase()
            ? m.recipientUsername
            : m.senderUsername
        )
    )
  );

  const friendsList = Array.from(new Set([...(currentUser.friends || []), ...messagePartners]));

  // Incoming / Outgoing request counts
  const pendingIncoming = friendRequests.filter(
    r => r.toUsername.toLowerCase() === currentUser.username.toLowerCase() && r.status === 'pending'
  );
  const pendingSent = friendRequests.filter(
    r => r.fromUsername.toLowerCase() === currentUser.username.toLowerCase() && r.status === 'pending'
  );

  // Live account search
  useEffect(() => {
    const query = addFriendInput.trim();
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      setIsSearchOpen(false);
      return;
    }

    setIsSearching(true);
    setIsSearchOpen(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchAccountsGlobally(query);
        const filtered = (results || []).filter(
          u => u.username.toLowerCase() !== currentUser.username.toLowerCase()
        );
        setSearchResults(filtered);
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [addFriendInput, currentUser.username]);

  // Handle clicking outside search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Send friend request
  const handleSendFriendRequest = async (e?: React.FormEvent, targetHandle?: string) => {
    if (e) e.preventDefault();
    const handle = (targetHandle || addFriendInput).replace(/^@/, '').trim();
    if (!handle) return;

    setIsSearchOpen(false);
    const res = await sendFriendRequestAction(handle);
    if (res.success) {
      setRequestFeedback({ success: true, message: `Friend request sent to @${handle}!` });
      setAddFriendInput('');
      setSearchResults([]);
    } else {
      setRequestFeedback({ success: false, message: res.error || `User @${handle} does not exist.` });
    }
    setTimeout(() => setRequestFeedback(null), 5000);
  };

  // Group Creation
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const res = await createGroupAction(newGroupName.trim(), selectedInitialFriends);
    if (res.success) {
      setNewGroupName('');
      setSelectedInitialFriends([]);
      setShowCreateGroupModal(false);
      setGroupFeedback({ success: true, message: `Group created successfully!` });
    } else {
      setGroupFeedback({ success: false, message: res.error || 'Failed to create group.' });
    }
    setTimeout(() => setGroupFeedback(null), 4000);
  };

  // Rename Group
  const handleRenameGroup = async () => {
    if (!activeGroup || !editGroupNameInput.trim()) return;
    const res = await renameGroupAction(activeGroup.id, editGroupNameInput.trim());
    if (res.success) {
      setIsEditingGroupName(false);
      setGroupFeedback({ success: true, message: 'Group renamed successfully.' });
    } else {
      setGroupFeedback({ success: false, message: res.error || 'Failed to rename group.' });
    }
    setTimeout(() => setGroupFeedback(null), 4000);
  };

  // Delete Group
  const handleDeleteGroup = async (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      const res = await deleteGroupAction(groupId);
      if (res.success) {
        setGroupFeedback({ success: true, message: 'Group deleted.' });
      }
      setTimeout(() => setGroupFeedback(null), 4000);
    }
  };

  // Add Member to Group (with group privacy validation)
  const handleAddMemberToGroup = async (targetUsername: string) => {
    if (!activeGroup) return;
    const clean = targetUsername.replace(/^@/, '').trim().toLowerCase();
    if (!clean) return;

    const res = await addMemberToGroupAction(activeGroup.id, clean);
    if (res.success) {
      setAddMemberInput('');
      setGroupFeedback({ success: true, message: `@${clean} added to ${activeGroup.name}!` });
    } else {
      setGroupFeedback({ success: false, message: res.error || 'Failed to add user.' });
    }
    setTimeout(() => setGroupFeedback(null), 5000);
  };

  // Remove Member from Group
  const handleRemoveMember = async (targetUsername: string) => {
    if (!activeGroup) return;
    const clean = targetUsername.replace(/^@/, '').trim().toLowerCase();
    const res = await removeMemberFromGroupAction(activeGroup.id, clean);
    if (res.success) {
      setGroupFeedback({ success: true, message: `@${clean} removed from group.` });
    }
    setTimeout(() => setGroupFeedback(null), 4000);
  };

  // Chat conversation messages
  const conversationMessages = chatMessages.filter(
    m =>
      activeChatFriend &&
      ((m.senderUsername.toLowerCase() === currentUser.username.toLowerCase() &&
        m.recipientUsername.toLowerCase() === activeChatFriend.toLowerCase()) ||
        (m.senderUsername.toLowerCase() === activeChatFriend.toLowerCase() &&
          m.recipientUsername.toLowerCase() === currentUser.username.toLowerCase()))
  );

  // Auto-scroll chat inside container
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversationMessages.length, activeChatFriend]);

  // Send regular text message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatFriend || !messageText.trim()) return;
    sendChatMessageAction(activeChatFriend, messageText.trim());
    setMessageText('');
  };

  // Send specific file attachment in chat
  const handleSendFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatFriend) return;

    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const tf: TransferFile = {
        id: `f-${Date.now()}`,
        name: file.name,
        url,
        size: `${sizeMb} MB`,
        type: file.type || 'application/octet-stream',
      };
      const attachment: ChatAttachment = {
        type: 'file',
        title: file.name,
        files: [tf],
        totalSize: `${sizeMb} MB`,
      };
      sendChatMessageAction(activeChatFriend, messageText.trim() || `Sent file: ${file.name}`, attachment);
      setMessageText('');
      setShowAttachMenu(false);
    };
    reader.readAsDataURL(file);
  };

  // Send folder attachment in chat
  const handleSendFolderAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeChatFriend) return;

    const folderName = files[0].webkitRelativePath?.split('/')[0] || 'Shared_Folder';
    const compiled: TransferFile[] = [];

    Array.from(files).slice(0, 15).forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        compiled.push({
          id: `f-${Date.now()}-${idx}`,
          name: file.name,
          url,
          size: `${sizeMb} MB`,
          type: file.type || 'application/octet-stream',
          folderPath: folderName,
        });

        if (compiled.length === Math.min(files.length, 15)) {
          const totalSizeMb = compiled.reduce((acc, f) => acc + (parseFloat(f.size) || 1), 0).toFixed(1);
          const attachment: ChatAttachment = {
            type: 'folder',
            title: folderName,
            files: compiled,
            totalSize: `${totalSizeMb} MB`,
          };
          sendChatMessageAction(
            activeChatFriend,
            messageText.trim() || `Sent folder: ${folderName} (${compiled.length} files)`,
            attachment
          );
          setMessageText('');
          setShowAttachMenu(false);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Download folder attachment as ZIP
  const handleDownloadAttachmentZip = async (attachment: ChatAttachment) => {
    try {
      setIsZipping(attachment.title);
      const zip = new JSZip();
      const folder = zip.folder(attachment.title) || zip;

      for (const f of attachment.files) {
        try {
          if (f.url.startsWith('data:')) {
            const base64Data = f.url.split(',')[1];
            folder.file(f.name, base64Data, { base64: true });
          } else {
            const res = await fetch(f.url);
            const blob = await res.blob();
            folder.file(f.name, blob);
          }
        } catch {
          folder.file(f.name.replace(/\.\w+$/, '.txt'), `Asset: ${f.name}\nSource: ${f.url}`);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${attachment.title}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch {
      alert('Could not generate ZIP');
    } finally {
      setIsZipping(null);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Top Header & Add Friend Bar */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5 border-[#383a40]">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--color-accent, #5865f2)' }} />
            <span className="font-mono-code text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              DIRECT TRANSFERS & FRIEND GROUPS
            </span>
          </div>
          <h1 className="mt-1 font-sans text-2xl font-bold tracking-tight text-white">
            Friends, Groups & Messaging
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Organize friends into custom groups, exchange folders in real-time, and manage shared packages.
          </p>
        </div>

        {/* Right side: Add Friend & Requests */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsRequestsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-[#383a40] bg-[#2b2d31] px-4 py-2 text-xs font-semibold text-neutral-200 hover:bg-[#313338] hover:border-neutral-500 transition-all shadow-sm"
          >
            <Users className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
            <span>Requests</span>
            {pendingIncoming.length > 0 ? (
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white animate-pulse">
                {pendingIncoming.length}
              </span>
            ) : pendingSent.length > 0 ? (
              <span className="rounded-full bg-[#383a40] px-1.5 py-0.5 text-[10px] text-neutral-300">
                {pendingSent.length} sent
              </span>
            ) : null}
          </button>

          {/* Add Friend Input with Global Directory Search */}
          <div ref={searchContainerRef} className="relative">
            <form onSubmit={handleSendFriendRequest} className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-code text-xs text-neutral-500">
                  @
                </span>
                <input
                  type="text"
                  placeholder="Add friend by username..."
                  value={addFriendInput}
                  onFocus={() => {
                    if (addFriendInput.trim().length > 0) setIsSearchOpen(true);
                  }}
                  onChange={e => {
                    setAddFriendInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                    setIsSearchOpen(true);
                  }}
                  aria-label="Add friend by username"
                  className="w-48 sm:w-56 rounded-xl border border-[#383a40] bg-[#1e1f22] py-2 pl-7 pr-3 font-mono-code text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 font-sans text-xs font-bold text-white shadow-sm transition-all active:scale-95"
                style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
              >
                <UserPlus className="h-4 w-4" />
                <span>Add</span>
              </button>
            </form>

            {/* Global Search Dropdown */}
            {isSearchOpen && addFriendInput.trim().length > 0 && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl border border-[#383a40] bg-[#2b2d31] p-2 shadow-2xl z-50 animate-in fade-in">
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#383a40] font-mono-code text-[10px] text-neutral-400 font-semibold uppercase">
                  <span>Directory Search</span>
                  {isSearching && <span className="animate-pulse text-[var(--color-accent)]">Searching...</span>}
                </div>

                <div className="max-h-56 overflow-y-auto divide-y divide-[#383a40] py-1">
                  {searchResults.length > 0 ? (
                    searchResults.map(u => {
                      const isFriend = (currentUser.friends || []).map(f => f.toLowerCase()).includes(u.username.toLowerCase());
                      const isSent = pendingSent.some(r => r.toUsername.toLowerCase() === u.username.toLowerCase());
                      const isIncoming = pendingIncoming.some(r => r.fromUsername.toLowerCase() === u.username.toLowerCase());

                      return (
                        <div key={u.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[#313338] transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0 mr-2">
                            <UserAvatar username={u.username} size="xs" />
                            <div className="min-w-0">
                              <p className="font-mono-code text-xs font-semibold text-white truncate">
                                @{u.username}
                              </p>
                              <p className="text-[10px] text-neutral-400 truncate">
                                {u.bio || 'Noir Archive user'}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isFriend ? (
                              <span className="font-mono-code text-[10px] font-semibold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">
                                ✓ Friend
                              </span>
                            ) : isSent ? (
                              <span className="font-mono-code text-[10px] font-semibold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10">
                                Pending
                              </span>
                            ) : isIncoming ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const req = pendingIncoming.find(r => r.fromUsername.toLowerCase() === u.username.toLowerCase());
                                  if (req) acceptFriendRequestAction(req.id);
                                  setIsSearchOpen(false);
                                }}
                                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-500 shadow-sm"
                              >
                                Accept
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSendFriendRequest(undefined, u.username)}
                                className="rounded-lg px-2.5 py-1 text-[10px] font-bold text-white shadow-sm"
                                style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                              >
                                + Add
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : isSearching ? (
                    <div className="p-4 text-center font-mono-code text-xs text-neutral-400">
                      Searching for "@{addFriendInput}"...
                    </div>
                  ) : (
                    <div className="p-3 text-center font-mono-code text-[11px] text-neutral-400">
                      <p>No user found for "@{addFriendInput}"</p>
                      <button
                        type="button"
                        onClick={() => handleSendFriendRequest(undefined, addFriendInput)}
                        className="mt-1.5 text-xs text-[var(--color-accent)] hover:underline block mx-auto font-semibold"
                      >
                        Send request to @{addFriendInput} anyway →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Alert Banners */}
      {requestFeedback && (
        <div
          className={`mb-6 flex items-center gap-2 p-3 text-xs rounded-xl border ${
            requestFeedback.success
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/40 bg-rose-500/10 text-rose-400'
          }`}
        >
          {requestFeedback.success ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{requestFeedback.message}</span>
        </div>
      )}

      {groupFeedback && (
        <div
          className={`mb-6 flex items-center gap-2 p-3 text-xs rounded-xl border ${
            groupFeedback.success
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/40 bg-rose-500/10 text-rose-400'
          }`}
        >
          {groupFeedback.success ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{groupFeedback.message}</span>
        </div>
      )}

      {/* Main Discord-Inspired Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-[#383a40] bg-[#1e1f22] overflow-hidden shadow-2xl min-h-[620px]">
        {/* Left Sidebar: Direct Messages & Friend Groups (4 cols) */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#383a40] bg-[#2b2d31] flex flex-col justify-between">
          <div className="overflow-y-auto">
            {/* 1. FRIEND GROUPS SECTION */}
            <div className="p-3 border-b border-[#383a40]">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="font-mono-code text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" style={{ color: 'var(--color-accent)' }} />
                  Friend Groups ({groups.length})
                </span>
                <button
                  onClick={() => setShowCreateGroupModal(true)}
                  className="flex items-center gap-1 rounded-lg bg-[#313338] hover:bg-[#383a40] px-2 py-1 text-[11px] font-semibold text-neutral-200 border border-[#383a40] transition-colors"
                  title="Create a new friend group"
                >
                  <Plus className="h-3 w-3" />
                  <span>New Group</span>
                </button>
              </div>

              {groups.length === 0 ? (
                <div className="p-3 text-center text-neutral-500 text-xs font-mono-code bg-[#232428] rounded-xl border border-[#383a40]">
                  <p>No friend groups created.</p>
                  <button
                    onClick={() => setShowCreateGroupModal(true)}
                    className="mt-1 text-xs font-semibold hover:underline"
                    style={{ color: 'var(--color-accent, #5865f2)' }}
                  >
                    + Create your first group
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {groups.map(grp => {
                    const isSelected = activeGroupId === grp.id;
                    const initial = (grp.name.charAt(0) || 'G').toUpperCase();
                    return (
                      <div
                        key={grp.id}
                        onClick={() => {
                          setActiveGroupId(grp.id);
                          setActiveChatFriend(null);
                        }}
                        className={`group w-full flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#313338] text-white shadow-sm border border-[var(--color-accent)]'
                            : 'hover:bg-[#232428] text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="h-8 w-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
                            style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                          >
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="font-sans text-xs font-bold text-white truncate">
                              {grp.name}
                            </p>
                            <p className="font-mono-code text-[10px] text-neutral-400">
                              {grp.memberUsernames.length} {grp.memberUsernames.length === 1 ? 'member' : 'members'}
                            </p>
                          </div>
                        </div>

                        {grp.ownerUsername.toLowerCase() === currentUser.username.toLowerCase() && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGroup(grp.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-400 transition-opacity"
                            title="Delete Group"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. DIRECT MESSAGES / FRIENDS LIST */}
            <div className="p-3">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="font-mono-code text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" style={{ color: 'var(--color-accent)' }} />
                  Direct Messages ({friendsList.length})
                </span>
              </div>

              {friendsList.length === 0 ? (
                <div className="p-4 text-center text-neutral-500 text-xs font-mono-code bg-[#232428] rounded-xl border border-[#383a40]">
                  <p>No friends added yet.</p>
                  <p className="text-[11px] mt-1 text-neutral-400">Add @elena_k or search above!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {friendsList.map(handle => {
                    const isSelected = !activeGroupId && activeChatFriend?.toLowerCase() === handle.toLowerCase();
                    return (
                      <button
                        key={handle}
                        onClick={() => {
                          setActiveChatFriend(handle);
                          setActiveGroupId(null);
                        }}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                          isSelected
                            ? 'bg-[#313338] text-white shadow-sm border border-[var(--color-accent)]'
                            : 'hover:bg-[#232428] text-neutral-300'
                        }`}
                      >
                        <UserAvatar username={handle} size="sm" showStatus={true} status="online" />
                        <div className="min-w-0 flex-1">
                          <p className="font-mono-code text-xs font-semibold text-white truncate">
                            @{handle}
                          </p>
                          <p className="text-[10px] text-neutral-400 truncate">
                            Online · Ready for transfers
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* User Status Bar at Bottom of Sidebar */}
          <div className="p-3 border-t border-[#383a40] bg-[#232428] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <UserAvatar username={currentUser.username} size="sm" showStatus={true} status="online" />
              <div className="min-w-0">
                <p className="font-mono-code text-xs font-bold text-white truncate">
                  @{currentUser.username}
                </p>
                <p className="text-[10px] text-neutral-400 truncate">
                  Connected
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="rounded-lg p-2 bg-[#313338] hover:bg-[#383a40] text-neutral-200 border border-[#383a40] transition-colors"
              title="Quick Send Transfer"
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right Main Panel: Group Details View OR 1-on-1 Chat (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between h-[620px] bg-[#1e1f22]">
          {/* VIEW A: FRIEND GROUP DETAIL VIEW */}
          {activeGroup ? (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {/* Group Header */}
              <div className="p-4 border-b border-[#383a40] bg-[#2b2d31] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-2xl flex items-center justify-center font-bold text-base text-white shadow-sm"
                    style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                  >
                    {activeGroup.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    {isEditingGroupName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editGroupNameInput}
                          onChange={e => setEditGroupNameInput(e.target.value)}
                          className="rounded-lg border border-[#383a40] bg-[#1e1f22] px-2 py-1 text-xs text-white focus:outline-none focus:border-[var(--color-accent)]"
                        />
                        <button
                          onClick={handleRenameGroup}
                          className="rounded bg-emerald-600 px-2 py-1 text-xs font-bold text-white"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setIsEditingGroupName(false)}
                          className="rounded bg-[#383a40] px-2 py-1 text-xs text-neutral-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-white">
                          {activeGroup.name}
                        </h2>
                        {activeGroup.ownerUsername.toLowerCase() === currentUser.username.toLowerCase() && (
                          <button
                            onClick={() => {
                              setEditGroupNameInput(activeGroup.name);
                              setIsEditingGroupName(true);
                            }}
                            className="text-neutral-400 hover:text-white"
                            title="Rename Group"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                    <p className="font-mono-code text-[11px] text-neutral-400">
                      Created by @{activeGroup.ownerUsername} • {activeGroup.memberUsernames.length} members
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsTransferModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all"
                    style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Share to Group</span>
                  </button>
                </div>
              </div>

              {/* Group Body: Members & Sharing Hub */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Add Friend to Group Box */}
                <div className="rounded-2xl border border-[#383a40] bg-[#2b2d31] p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 font-mono-code mb-2">
                    Add Existing Friend to "{activeGroup.name}"
                  </h3>
                  <div className="flex gap-2">
                    <select
                      value={addMemberInput}
                      onChange={e => setAddMemberInput(e.target.value)}
                      className="flex-1 rounded-xl border border-[#383a40] bg-[#1e1f22] px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--color-accent)] font-mono-code"
                    >
                      <option value="">Select a friend to add...</option>
                      {friendsList
                        .filter(f => !activeGroup.memberUsernames.map(m => m.toLowerCase()).includes(f.toLowerCase()))
                        .map(f => (
                          <option key={f} value={f}>
                            @{f}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => handleAddMemberToGroup(addMemberInput)}
                      disabled={!addMemberInput}
                      className="rounded-xl px-4 py-2 text-xs font-bold text-white disabled:opacity-50 transition-all shadow-sm"
                      style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                    >
                      Add to Group
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-neutral-400">
                    Subject to each friend's Group Invitation Privacy Setting.
                  </p>
                </div>

                {/* Member Roster with Letter-Based Avatars */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 font-mono-code mb-3">
                    Group Members ({activeGroup.memberUsernames.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeGroup.memberUsernames.map(member => {
                      const isOwner = member.toLowerCase() === activeGroup.ownerUsername.toLowerCase();
                      const isMe = member.toLowerCase() === currentUser.username.toLowerCase();

                      return (
                        <div
                          key={member}
                          className="flex items-center justify-between p-3 rounded-xl border border-[#383a40] bg-[#2b2d31]"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <UserAvatar username={member} size="sm" />
                            <div className="min-w-0">
                              <p className="font-mono-code text-xs font-bold text-white truncate">
                                @{member}
                              </p>
                              <span className="text-[10px] text-neutral-400 font-mono-code">
                                {isOwner ? '👑 Group Owner' : 'Group Member'}
                              </span>
                            </div>
                          </div>

                          {!isOwner && (activeGroup.ownerUsername.toLowerCase() === currentUser.username.toLowerCase() || isMe) && (
                            <button
                              onClick={() => handleRemoveMember(member)}
                              className="text-neutral-400 hover:text-rose-400 p-1 transition-colors"
                              title={isMe ? 'Leave Group' : 'Remove Member'}
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : activeChatFriend ? (
            /* VIEW B: 1-ON-1 DIRECT CHAT */
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {/* Chat Header */}
              <div className="p-3.5 border-b border-[#383a40] bg-[#2b2d31] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserAvatar username={activeChatFriend} size="xs" showStatus={true} status="online" />
                  <div>
                    <h2 className="font-mono-code text-xs font-bold text-white">
                      @{activeChatFriend}
                    </h2>
                    <p className="text-[10px] text-neutral-400">
                      Encrypted peer transfer channel
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 rounded-lg border border-[#383a40] bg-[#313338] px-3 py-1 font-mono-code text-[11px] text-neutral-200 hover:border-neutral-500 cursor-pointer transition-colors">
                    <Folder className="h-3 w-3" style={{ color: 'var(--color-accent)' }} />
                    <span>Send Folder</span>
                    {/* @ts-ignore */}
                    <input
                      type="file"
                      // @ts-expect-error webkitdirectory
                      webkitdirectory=""
                      directory=""
                      multiple
                      onChange={handleSendFolderAttachment}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Chat Messages */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {conversationMessages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-neutral-500 font-mono-code text-xs">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-40 text-neutral-400" />
                    <p>Start a transfer conversation with @{activeChatFriend}</p>
                    <p className="text-[11px] mt-1 text-neutral-400">
                      Use the '+' attachment menu or 'Send Folder' above to send files.
                    </p>
                  </div>
                ) : (
                  conversationMessages.map(msg => {
                    const isMe = msg.senderUsername.toLowerCase() === currentUser.username.toLowerCase();

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 font-mono-code text-[10px] text-neutral-500">
                          <UserAvatar username={msg.senderUsername} size="xs" />
                          <span>@{msg.senderUsername}</span>
                          <span>•</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        {msg.text && (
                          <div
                            className={`max-w-md rounded-2xl px-4 py-2.5 text-xs font-sans leading-relaxed shadow-sm ${
                              isMe
                                ? 'text-white font-medium shadow-md'
                                : 'bg-[#2b2d31] border border-[#383a40] text-neutral-200'
                            }`}
                            style={{ backgroundColor: isMe ? 'var(--color-accent, #5865f2)' : undefined }}
                          >
                            {msg.text}
                          </div>
                        )}

                        {/* Attachment Card */}
                        {msg.attachment && (
                          <div className="mt-1.5 max-w-sm rounded-2xl border border-[#383a40] bg-[#2b2d31] p-3 shadow-md">
                            <div className="flex items-center justify-between mb-2">
                              <span className="flex items-center gap-1.5 font-mono-code text-[11px] uppercase font-bold text-white">
                                {msg.attachment.type === 'folder' ? (
                                  <>
                                    <Folder className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
                                    <span>Folder: {msg.attachment.title}</span>
                                  </>
                                ) : (
                                  <>
                                    <FileImage className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
                                    <span>File: {msg.attachment.title}</span>
                                  </>
                                )}
                              </span>
                              <span className="font-mono-code text-[10px] text-neutral-400">
                                {msg.attachment.totalSize}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-[#383a40]">
                              <span className="font-mono-code text-[10px] text-neutral-400">
                                {msg.attachment.files.length} {msg.attachment.files.length === 1 ? 'file' : 'files'}
                              </span>

                              {msg.attachment.type === 'folder' ? (
                                <button
                                  onClick={() => msg.attachment && handleDownloadAttachmentZip(msg.attachment)}
                                  disabled={isZipping === msg.attachment.title}
                                  className="flex items-center gap-1.5 rounded-lg px-3 py-1 font-mono-code text-[10px] font-bold text-white shadow-sm"
                                  style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                                >
                                  <FileArchive className="h-3 w-3" />
                                  <span>{isZipping === msg.attachment.title ? 'Packaging...' : 'Download (.ZIP)'}</span>
                                </button>
                              ) : (
                                <a
                                  href={msg.attachment.files[0]?.url}
                                  download={msg.attachment.files[0]?.name || 'download'}
                                  className="flex items-center gap-1.5 rounded-lg px-3 py-1 font-mono-code text-[10px] font-bold text-white shadow-sm"
                                  style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                                >
                                  <Download className="h-3 w-3" />
                                  <span>Download</span>
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar with '+' button */}
              <div className="p-3 border-t border-[#383a40] bg-[#2b2d31] relative">
                {showAttachMenu && (
                  <div className="absolute right-4 bottom-14 w-60 rounded-2xl border border-[#383a40] bg-[#232428] p-2 shadow-2xl z-40 animate-in fade-in space-y-1">
                    <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-[#313338] text-xs text-neutral-200 cursor-pointer transition-colors">
                      <FileImage className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
                      <span>Upload Single File</span>
                      <input type="file" onChange={handleSendFileAttachment} className="hidden" />
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-[#313338] text-xs text-neutral-200 cursor-pointer transition-colors">
                      <Folder className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
                      <span>Upload Entire Folder</span>
                      {/* @ts-ignore */}
                      <input
                        type="file"
                        // @ts-expect-error webkitdirectory
                        webkitdirectory=""
                        directory=""
                        multiple
                        onChange={handleSendFolderAttachment}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Message @${activeChatFriend}...`}
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    className="flex-1 rounded-xl border border-[#383a40] bg-[#1e1f22] py-2 px-3 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[var(--color-accent)]"
                  />

                  <button
                    type="button"
                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                    className="rounded-xl border border-[#383a40] bg-[#1e1f22] p-2 text-neutral-300 hover:text-white hover:bg-[#313338] transition-colors"
                    title="Attach File or Folder"
                  >
                    <Plus className="h-4 w-4" />
                  </button>

                  <button
                    type="submit"
                    className="rounded-xl p-2 font-bold text-white shadow-sm transition-all active:scale-95"
                    style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-neutral-500 font-mono-code text-xs">
              <Users className="h-10 w-10 mb-3 opacity-30 text-neutral-400" />
              <h3 className="font-sans text-base font-bold text-neutral-200">
                Select a Friend or Group
              </h3>
              <p className="mt-1 max-w-sm text-neutral-400">
                Choose a direct message on the left, organize your friends into groups, or start sharing folders.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE FRIEND GROUP MODAL */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-[#383a40] bg-[#2b2d31] p-6 shadow-2xl text-white">
            <button
              onClick={() => setShowCreateGroupModal(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div
                className="h-8 w-8 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
              >
                <Layers className="h-4 w-4" />
              </div>
              <h2 className="font-sans text-lg font-bold text-white">
                Create Friend Group
              </h2>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block font-mono-code text-[11px] uppercase tracking-wider text-neutral-300 font-bold mb-1">
                  Group Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gaming, Family, Projects..."
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="w-full rounded-xl border border-[#383a40] bg-[#1e1f22] py-2 px-3 text-xs text-white focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div>
                <label className="block font-mono-code text-[11px] uppercase tracking-wider text-neutral-300 font-bold mb-1">
                  Add Existing Friends (Optional)
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl border border-[#383a40] bg-[#1e1f22] p-2">
                  {friendsList.length === 0 ? (
                    <p className="text-[11px] text-neutral-500 font-mono-code p-2">
                      No friends yet. You can still create the group now and add members later!
                    </p>
                  ) : (
                    friendsList.map(friend => {
                      const isSelected = selectedInitialFriends.includes(friend);
                      return (
                        <div
                          key={friend}
                          onClick={() => {
                            setSelectedInitialFriends(prev =>
                              prev.includes(friend) ? prev.filter(f => f !== friend) : [...prev, friend]
                            );
                          }}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs ${
                            isSelected ? 'bg-[#313338] text-white' : 'text-neutral-300 hover:bg-[#282a2e]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <UserAvatar username={friend} size="xs" />
                            <span className="font-mono-code">@{friend}</span>
                          </div>
                          <div
                            className={`h-4 w-4 rounded flex items-center justify-center border ${
                              isSelected ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white' : 'border-[#383a40]'
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="rounded-xl border border-[#383a40] px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-[#313338]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newGroupName.trim()}
                  className="rounded-xl px-5 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FRIEND REQUESTS HUB MODAL */}
      <FriendRequestsModal
        isOpen={isRequestsModalOpen}
        onClose={() => setIsRequestsModalOpen(false)}
      />
    </section>
  );
};
