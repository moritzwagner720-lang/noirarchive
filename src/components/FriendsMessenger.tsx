import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  UserPlus,
  Send,
  Plus,
  Paperclip,
  Folder,
  FileImage,
  Upload,
  Download,
  Check,
  Clock,
  MessageSquare,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  FileArchive,
  Image as ImageIcon,
  FolderDown,
  X,
} from 'lucide-react';
import { TransferFile, ChatAttachment } from '../types';
import JSZip from 'jszip';
import { FriendRequestsModal } from './FriendRequestsModal';

export const FriendsMessenger: React.FC = () => {
  const {
    currentUser,
    users,
    projects,
    photos,
    friendRequests,
    chatMessages,
    sendFriendRequestAction,
    acceptFriendRequestAction,
    declineFriendRequestAction,
    sendChatMessageAction,
    activeChatFriend,
    setActiveChatFriend,
    setAuthModal,
    setLightboxPhoto,
    theme,
  } = useApp();

  const [addFriendInput, setAddFriendInput] = useState('');
  const [requestFeedback, setRequestFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [isZipping, setIsZipping] = useState<string | null>(null);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);

  const isLight = theme === 'light';

  if (!currentUser) {
    return (
      <section id="friends-section" className="mx-auto max-w-4xl py-12 px-4 text-center">
        <div
          className={`rounded-2xl border p-8 shadow-xl relative overflow-hidden transition-colors ${
            isLight
              ? 'bg-amber-50/90 border-amber-300 text-stone-900 shadow-orange-500/10'
              : 'bg-[#140b07] border-orange-500/30 text-white shadow-2xl shadow-orange-950/60'
          }`}
        >
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-600/15 rounded-full blur-2xl" />
          <UserPlus className="mx-auto mb-3 h-10 w-10 text-[#ff6b00]" />
          <h2 className="font-sans text-2xl font-bold tracking-tight">Coven Friends & Peer Vault Messenger</h2>
          <p className={`mt-2 text-xs max-w-md mx-auto ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
            Connect with other creators, send requests by username, and exchange high-resolution files and folders directly inside live chat.
          </p>
          <button
            onClick={() => setAuthModal('signup')}
            className="mt-5 rounded-xl bg-[#ff6b00] px-6 py-2.5 text-xs font-bold text-black hover:bg-[#e05e00] transition-all shadow-md shadow-[#ff6b00]/25"
          >
            Claim Username & Join Friends
          </button>
        </div>
      </section>
    );
  }

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derive all active chat partners (friends + anyone who has messaged current user or vice versa)
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

  const friendsList = Array.from(
    new Set([...(currentUser.friends || []), ...messagePartners])
  );

  // Auto-select first conversation partner if none selected or if current selection is invalid
  useEffect(() => {
    if (friendsList.length > 0) {
      if (!activeChatFriend || !friendsList.some(f => f.toLowerCase() === activeChatFriend.toLowerCase())) {
        setActiveChatFriend(friendsList[0]);
      }
    }
  }, [friendsList, activeChatFriend, setActiveChatFriend]);

  // Pending incoming requests
  const pendingIncoming = friendRequests.filter(
    r => r.toUsername.toLowerCase() === currentUser.username.toLowerCase() && r.status === 'pending'
  );

  // Pending outgoing requests
  const pendingSent = friendRequests.filter(
    r => r.fromUsername.toLowerCase() === currentUser.username.toLowerCase() && r.status === 'pending'
  );

  // Send a friend request
  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanHandle = addFriendInput.replace(/^@/, '').trim();
    if (!cleanHandle) return;

    const res = await sendFriendRequestAction(cleanHandle);
    if (res.success) {
      setRequestFeedback({
        success: true,
        message: `Friend request sent to @${cleanHandle}!`,
      });
      setAddFriendInput('');
    } else {
      setRequestFeedback({
        success: false,
        message: res.error || `User @${cleanHandle} does not exist.`,
      });
    }

    setTimeout(() => setRequestFeedback(null), 5000);
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

  // Auto-scroll chat window when new messages arrive or when conversation changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages.length, activeChatFriend]);

  // Send regular text message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatFriend || !messageText.trim()) return;

    sendChatMessageAction(activeChatFriend, messageText.trim());
    setMessageText('');
  };

  // Send a specific file as attachment in chat
  const handleSendFileAttachment = (file: TransferFile) => {
    if (!activeChatFriend) return;
    const attachment: ChatAttachment = {
      type: 'file',
      title: file.name,
      files: [file],
      totalSize: file.size,
    };
    sendChatMessageAction(activeChatFriend, messageText.trim() || `Sent file: ${file.name}`, attachment);
    setMessageText('');
    setShowAttachMenu(false);
    setShowFileModal(false);
  };

  // Send a specific folder as attachment in chat
  const handleSendFolderAttachment = (folderName: string, filesList: TransferFile[]) => {
    if (!activeChatFriend || filesList.length === 0) return;
    const attachment: ChatAttachment = {
      type: 'folder',
      title: folderName,
      files: filesList,
      totalSize: `${filesList.length * 15} MB`,
    };
    sendChatMessageAction(activeChatFriend, messageText.trim() || `Sent folder: ${folderName} (${filesList.length} files)`, attachment);
    setMessageText('');
    setShowAttachMenu(false);
    setShowFolderModal(false);
  };

  // Local file picker handler
  const handleLocalFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        type: file.type || 'image/jpeg',
      };
      handleSendFileAttachment(tf);
    };
    reader.readAsDataURL(file);
  };

  // Local folder picker handler (supports webkitdirectory for real folder upload!)
  const handleLocalFolderChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeChatFriend) return;

    const folderName = files[0].webkitRelativePath?.split('/')[0] || 'Uploaded_Folder';
    const compiled: TransferFile[] = [];

    Array.from(files).slice(0, 10).forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        compiled.push({
          id: `f-${Date.now()}-${idx}`,
          name: file.name,
          url,
          size: `${sizeMb} MB`,
          type: file.type || 'image/jpeg',
          folderPath: folderName,
        });

        if (compiled.length === Math.min(files.length, 10)) {
          handleSendFolderAttachment(folderName, compiled);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Download folder attachment as ZIP inside chat
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
          folder.file(f.name.replace(/\.\w+$/, '.txt'), `File asset: ${f.name}\nSource: ${f.url}`);
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
    } catch (err) {
      console.error(err);
      alert('Could not generate ZIP');
    } finally {
      setIsZipping(null);
    }
  };

  return (
    <section id="friends-section" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Section Header */}
      <div className={`mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between border-b pb-5 transition-colors ${
        isLight ? 'border-slate-200' : 'border-neutral-800'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#ff6b00] animate-pulse" />
            <span className="font-mono-code text-[11px] font-bold uppercase tracking-wider text-[#ff6b00]">
              PEER MESSAGING & FILE EXCHANGE
            </span>
          </div>
          <h2 className="mt-1 font-sans text-2xl font-bold tracking-tight sm:text-3xl">
            Add Friends & Direct File Transfer
          </h2>
          <p className={`mt-1 text-xs ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
            Send friend requests to creators, chat in real-time, and transfer files or folders directly in conversation.
          </p>
        </div>

        {/* Right side: Manage Requests button directly OVER Add Friend form */}
        <div className="flex flex-col sm:items-end gap-2.5">
          <button
            type="button"
            onClick={() => setIsRequestsModalOpen(true)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-1.5 font-sans text-xs font-semibold transition-all cursor-pointer ${
              pendingIncoming.length > 0
                ? 'border-orange-500 bg-orange-600/15 text-[#ff6b00] hover:bg-orange-600/25 shadow-sm shadow-orange-950/40'
                : isLight
                ? 'border-amber-300 bg-white text-stone-700 hover:bg-amber-50 hover:border-amber-400'
                : 'border-orange-500/30 bg-[#160d09] text-orange-200 hover:bg-[#1f120c] hover:border-orange-500/50'
            }`}
          >
            <Users className="h-3.5 w-3.5 text-[#ff6b00]" />
            <span>Friend Requests</span>
            {pendingIncoming.length > 0 ? (
              <span className="flex h-5 items-center justify-center rounded-full bg-[#ff6b00] px-2 text-[10px] font-bold text-black animate-pulse">
                {pendingIncoming.length} new
              </span>
            ) : pendingSent.length > 0 ? (
              <span
                className={`flex h-4 items-center justify-center rounded-full px-1.5 text-[10px] ${
                  isLight ? 'bg-amber-100 text-stone-600' : 'bg-[#22130c] text-orange-300'
                }`}
              >
                {pendingSent.length} sent
              </span>
            ) : null}
          </button>

          {/* Add Friend Form */}
          <form onSubmit={handleSendFriendRequest} className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-code text-xs text-[#ff6b00]">
                @
              </span>
              <input
                type="text"
                placeholder="username (e.g. daddy)"
                value={addFriendInput}
                onChange={e => setAddFriendInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                aria-label="Add friend by username handle"
                className={`w-48 sm:w-56 rounded-lg border py-2 pl-7 pr-3 font-mono-code text-xs focus:border-[#ff6b00] focus:outline-none transition-colors ${
                  isLight
                    ? 'bg-white border-amber-300 text-stone-900'
                    : 'bg-[#160d09] border-orange-500/30 text-white placeholder:text-neutral-500'
                }`}
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-[#ff6b00] px-5 py-2 font-sans text-xs font-bold text-black hover:bg-[#ff7d1f] transition-all shadow-md shadow-orange-950/40 cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Add Friend</span>
            </button>
          </form>
        </div>
      </div>

      {/* Friend Request Feedback */}
      {requestFeedback && (
        <div
          className={`mb-6 flex items-center gap-2 p-3 text-xs rounded-xl border ${
            requestFeedback.success
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
              : 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300'
          }`}
        >
          {requestFeedback.success ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          )}
          <span>{requestFeedback.message}</span>
        </div>
      )}

      {/* Pending Incoming Requests Banner */}
      {pendingIncoming.length > 0 && (
        <div className={`mb-6 rounded-2xl border p-4 ${
          isLight ? 'border-amber-300 bg-amber-50/60' : 'border-orange-500/30 bg-orange-950/20'
        }`}>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#ff6b00] uppercase tracking-wider mb-2">
            <UserPlus className="h-4 w-4" />
            <span>Incoming Friend Requests ({pendingIncoming.length})</span>
          </div>
          <div className="space-y-2">
            {pendingIncoming.map(req => (
              <div
                key={req.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  isLight ? 'bg-white border-amber-200' : 'bg-[#180e0a] border-orange-500/25'
                }`}
              >
                <div className="flex items-center gap-2 font-mono-code text-xs">
                  <span className="font-bold text-[#ff6b00]">@{req.fromUsername}</span>
                  <span className="opacity-70">wants to connect with you</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => acceptFriendRequestAction(req.id)}
                    className="rounded-lg bg-emerald-600 px-3.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500 shadow-sm"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => declineFriendRequestAction(req.id)}
                    className={`rounded-lg px-3 py-1 text-xs border transition-colors ${
                      isLight ? 'border-amber-300 text-stone-600 hover:bg-amber-100' : 'border-orange-500/30 text-neutral-400 hover:bg-[#22130c]'
                    }`}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Friends & Messenger Layout */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-12 rounded-2xl border min-h-[550px] shadow-xl overflow-hidden transition-colors ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#12131a] border-neutral-800 text-white'
        }`}
      >
        {/* Left: Friends List Sidebar (4 cols) */}
        <div
          className={`lg:col-span-4 border-b lg:border-b-0 lg:border-r flex flex-col justify-between ${
            isLight ? 'border-slate-200 bg-slate-50/50' : 'border-neutral-800 bg-neutral-950/40'
          }`}
        >
          <div>
            <div className={`p-4 border-b flex items-center justify-between ${isLight ? 'border-slate-200' : 'border-neutral-800'}`}>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#ff6b00]" />
                <span className="font-sans text-xs font-bold uppercase tracking-wider">
                  Friends ({friendsList.length})
                </span>
              </div>
              <span className="font-mono-code text-[10px] opacity-60">Connected</span>
            </div>

            {/* List of Friends */}
            {friendsList.length === 0 ? (
              <div className="p-8 text-center opacity-60 font-mono-code text-xs">
                <p>No friends added yet.</p>
                <p className="mt-1 text-[11px]">
                  Type a username above like <span className="text-[#ff6b00]">@elena_k</span> to send a request!
                </p>
              </div>
            ) : (
              <div className={`divide-y ${isLight ? 'divide-slate-200/60' : 'divide-neutral-900'}`}>
                {friendsList.map(handle => {
                  const friendUser = users.find(u => u.username.toLowerCase() === handle.toLowerCase());
                  const isSelected = activeChatFriend?.toLowerCase() === handle.toLowerCase();

                  // Latest message between currentUser and handle
                  const threadMessages = chatMessages.filter(
                    m =>
                      (m.senderUsername.toLowerCase() === currentUser.username.toLowerCase() &&
                        m.recipientUsername.toLowerCase() === handle.toLowerCase()) ||
                      (m.senderUsername.toLowerCase() === handle.toLowerCase() &&
                        m.recipientUsername.toLowerCase() === currentUser.username.toLowerCase())
                  );
                  const lastMsg = threadMessages[threadMessages.length - 1];
                  const hasUnread = lastMsg && lastMsg.senderUsername.toLowerCase() === handle.toLowerCase() && !isSelected;
                  const timeStr = lastMsg
                    ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';
                  const snippet = lastMsg
                    ? lastMsg.attachment
                      ? lastMsg.attachment.type === 'folder'
                        ? `📁 ${lastMsg.attachment.title}`
                        : `📷 ${lastMsg.attachment.title}`
                      : lastMsg.text
                    : (friendUser?.bio || 'Connected collaborator');

                  return (
                    <button
                      key={handle}
                      onClick={() => setActiveChatFriend(handle)}
                      className={`w-full flex items-center justify-between p-3.5 text-left transition-colors ${
                        isSelected
                          ? isLight
                            ? 'bg-amber-100/70 border-l-2 border-[#ff6b00]'
                            : 'bg-[#22120a] border-l-2 border-[#ff6b00]'
                          : isLight
                          ? 'hover:bg-amber-50'
                          : 'hover:bg-[#180e0a]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                        <div className="relative shrink-0">
                          <img
                            src={
                              friendUser?.avatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                            }
                            alt={handle}
                            className="h-9 w-9 rounded-full object-cover ring-1 ring-orange-500/40"
                          />
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#ff6b00] ring-2 ring-white dark:ring-black" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className={`font-mono-code text-xs font-semibold truncate ${isLight ? 'text-stone-900' : 'text-orange-100'}`}>
                              @{handle}
                            </p>
                            {timeStr && (
                              <span className="font-mono-code text-[10px] opacity-50 shrink-0">
                                {timeStr}
                              </span>
                            )}
                          </div>
                          <p className={`font-sans text-[11px] truncate ${
                            hasUnread ? 'font-bold text-[#ff6b00]' : 'opacity-70'
                          }`}>
                            {snippet}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasUnread && (
                          <span className="h-2 w-2 rounded-full bg-[#ff6b00] animate-pulse" title="New message" />
                        )}
                        <span className="font-mono-code text-[11px] text-[#ff6b00] font-bold">
                          Chat →
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Member Discovery Helper */}
          <div className={`p-3 border-t font-mono-code text-[10px] ${
            isLight ? 'border-amber-200 bg-amber-50/70' : 'border-orange-500/15 bg-[#140b07]'
          }`}>
            <span className="block uppercase opacity-60 mb-1 text-orange-300">Discover Platform Creators:</span>
            <div className="flex flex-wrap gap-1">
              {users
                .filter(u => u.username !== currentUser.username && !friendsList.includes(u.username))
                .map(u => (
                  <button
                    key={u.id}
                    onClick={async () => {
                      const res = await sendFriendRequestAction(u.username);
                      if (res.success) {
                        setRequestFeedback({
                          success: true,
                          message: `Friend request sent to @${u.username}!`,
                        });
                      } else {
                        setRequestFeedback({
                          success: false,
                          message: res.error || 'Failed to send request.',
                        });
                      }
                      setTimeout(() => setRequestFeedback(null), 4000);
                    }}
                    className={`rounded-lg px-2.5 py-0.5 border text-[10px] transition-colors ${
                      isLight
                        ? 'border-amber-300 bg-white hover:border-orange-500 hover:text-orange-600'
                        : 'border-orange-500/20 bg-[#1c0f0a] hover:border-[#ff6b00] hover:text-white'
                    }`}
                  >
                    + @{u.username}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Right: Live Chat with Active Friend (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between h-[550px]">
          {activeChatFriend ? (
            <>
              {/* Chat Header */}
              <div className={`p-3.5 border-b flex items-center justify-between ${
                isLight ? 'border-amber-200 bg-amber-50/50' : 'border-orange-500/15 bg-[#140b07]'
              }`}>
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-[#ff6b00]" />
                  <span className={`font-mono-code text-xs font-semibold ${isLight ? 'text-stone-900' : 'text-orange-100'}`}>
                    @{activeChatFriend}
                  </span>
                  <span className="font-mono-code text-[10px] opacity-60">
                    • Nocturnal Peer Channel
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFolderModal(true)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 font-mono-code text-[11px] transition-colors ${
                      isLight
                        ? 'border-amber-300 bg-white hover:border-[#ff6b00] hover:text-[#ff6b00]'
                        : 'border-orange-500/30 bg-[#1e110c] hover:border-orange-400 text-orange-200'
                    }`}
                  >
                    <Folder className="h-3 w-3 text-[#ff6b00]" />
                    <span>Send Folder</span>
                  </button>
                </div>
              </div>

              {/* Chat Messages Log */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {conversationMessages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center opacity-60 font-mono-code text-xs">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-50 text-orange-400" />
                    <p>Start a conversation with @{activeChatFriend}</p>
                    <p className="text-[11px] mt-1">
                      Use the "+" icon on the right of the typing bar to send files or entire folders.
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
                        <div className="flex items-center gap-1.5 mb-1 font-mono-code text-[10px] opacity-60">
                          <span>@{msg.senderUsername}</span>
                          <span>•</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        {/* Text bubble */}
                        {msg.text && (
                          <div
                            className={`max-w-md rounded-2xl px-4 py-2 text-xs font-sans leading-relaxed shadow-sm ${
                              isMe
                                ? 'bg-[#ff6b00] text-black font-semibold shadow-md shadow-orange-950/40'
                                : isLight
                                ? 'bg-amber-100/80 border border-amber-200 text-stone-900'
                                : 'bg-[#180e0a] border border-orange-500/25 text-neutral-200'
                            }`}
                          >
                            {msg.text}
                          </div>
                        )}

                        {/* Attachment Card if any (File or Folder) */}
                        {msg.attachment && (
                          <div
                            className={`mt-1.5 max-w-sm rounded-xl border p-3 shadow-sm ${
                              isLight
                                ? 'border-amber-300 bg-amber-50'
                                : 'border-orange-500/30 bg-[#1c0f0a]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="flex items-center gap-1.5 font-mono-code text-[10px] uppercase font-bold text-[#ff6b00]">
                                {msg.attachment.type === 'folder' ? (
                                  <>
                                    <Folder className="h-3.5 w-3.5 text-[#ff6b00]" />
                                    <span>Folder: {msg.attachment.title}</span>
                                  </>
                                ) : (
                                  <>
                                    <FileImage className="h-3.5 w-3.5 text-[#ff6b00]" />
                                    <span>File: {msg.attachment.title}</span>
                                  </>
                                )}
                              </span>
                              <span className="font-mono-code text-[10px] opacity-70">
                                {msg.attachment.totalSize}
                              </span>
                            </div>

                            {/* Image Thumbnails preview */}
                            <div className="grid grid-cols-2 gap-1.5 my-2">
                              {msg.attachment.files.slice(0, 2).map(f => (
                                <div
                                  key={f.id}
                                  onClick={() => {
                                    const match = photos.find(p => p.url === f.url);
                                    if (match) setLightboxPhoto(match);
                                  }}
                                  className="aspect-[4/3] rounded-lg overflow-hidden bg-black cursor-pointer shadow-sm"
                                >
                                  <img
                                    src={f.url}
                                    alt={f.name}
                                    className="h-full w-full object-cover grayscale hover:scale-105 transition-transform"
                                  />
                                </div>
                              ))}
                            </div>

                            {/* Download Action */}
                            <div className="mt-2 flex items-center justify-between pt-2 border-t border-orange-500/20">
                              <span className="font-mono-code text-[10px] opacity-70">
                                {msg.attachment.files.length} {msg.attachment.files.length === 1 ? 'asset' : 'assets'}
                              </span>

                              {msg.attachment.type === 'folder' ? (
                                <button
                                  onClick={() => msg.attachment && handleDownloadAttachmentZip(msg.attachment)}
                                  disabled={isZipping === msg.attachment.title}
                                  className="flex items-center gap-1 rounded-lg bg-[#ff6b00] px-3 py-1 font-mono-code text-[10px] font-bold uppercase text-black hover:bg-[#ff7d1f] transition-colors shadow-sm"
                                >
                                  <FileArchive className="h-3 w-3" />
                                  <span>{isZipping === msg.attachment.title ? 'Zipping...' : 'Download (.ZIP)'}</span>
                                </button>
                              ) : (
                                <a
                                  href={msg.attachment.files[0]?.url}
                                  download={msg.attachment.files[0]?.name || 'download.jpg'}
                                  className="flex items-center gap-1 rounded-lg bg-[#ff6b00] px-3 py-1 font-mono-code text-[10px] font-bold uppercase text-black hover:bg-[#ff7d1f] transition-colors shadow-sm"
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

              {/* Bottom Typing Bar with '+' button on the right side */}
              <div className={`p-3 border-t relative transition-colors ${
                isLight ? 'border-amber-200 bg-amber-50/70' : 'border-orange-500/15 bg-[#140b07]'
              }`}>
                {/* Popover Attachment Menu when '+' is clicked */}
                {showAttachMenu && (
                  <div
                    className={`absolute right-4 bottom-14 w-60 rounded-xl border p-2 shadow-2xl z-40 animate-in fade-in transition-colors ${
                      isLight
                        ? 'bg-white border-amber-200 text-stone-900 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.15)]'
                        : 'bg-[#180e0a] border-orange-500/30 text-white shadow-[0_10px_35px_-5px_rgba(255,107,0,0.2)]'
                    }`}
                  >
                    <div className="font-mono-code text-[10px] uppercase opacity-60 px-2 py-1 border-b border-orange-500/20 text-orange-300">
                      Attach & Send
                    </div>

                    <div className="py-1 space-y-0.5">
                      {/* Select a File option */}
                      <button
                        onClick={() => {
                          setShowAttachMenu(false);
                          setShowFileModal(true);
                        }}
                        className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition-colors ${
                          isLight ? 'hover:bg-amber-100' : 'hover:bg-[#24130c]'
                        }`}
                      >
                        <FileImage className="h-4 w-4 text-[#ff6b00] shrink-0" />
                        <div>
                          <p className="font-semibold">Select a File</p>
                          <p className="text-[10px] opacity-60">Pick photo or upload from disk</p>
                        </div>
                      </button>

                      {/* Select a Folder option */}
                      <button
                        onClick={() => {
                          setShowAttachMenu(false);
                          setShowFolderModal(true);
                        }}
                        className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition-colors ${
                          isLight ? 'hover:bg-amber-100' : 'hover:bg-[#24130c]'
                        }`}
                      >
                        <Folder className="h-4 w-4 text-amber-500 shrink-0" />
                        <div>
                          <p className="font-semibold">Select a Folder</p>
                          <p className="text-[10px] opacity-60">Send full album or directory</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Form Input Bar */}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    aria-label={`Message @${activeChatFriend}`}
                    placeholder="Write a message..."
                    className={`flex-1 rounded-lg border py-2 px-4 font-sans text-xs focus:border-[#ff6b00] focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-white border-amber-300 text-stone-900'
                        : 'bg-[#100805] border-orange-500/30 text-white placeholder:text-neutral-500'
                    }`}
                  />

                  {/* The '+' button on the right side of the typing bar */}
                  <button
                    type="button"
                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                    title="Attach file or folder"
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
                      showAttachMenu
                        ? 'border-[#ff6b00] bg-[#ff6b00] text-black rotate-45 shadow-sm'
                        : isLight
                        ? 'border-amber-300 bg-white text-stone-700 hover:border-[#ff6b00] hover:text-[#ff6b00]'
                        : 'border-orange-500/30 bg-[#1e110c] text-orange-200 hover:border-orange-400'
                    }`}
                  >
                    <Plus className="h-5 w-5" />
                  </button>

                  <button
                    type="submit"
                    disabled={!messageText.trim()}
                    className="flex h-9 items-center gap-1.5 rounded-lg bg-[#ff6b00] px-4 text-xs font-bold text-black hover:bg-[#ff7d1f] transition-colors shadow-sm disabled:opacity-40"
                  >
                    <Send className="h-3 w-3 stroke-[2.5]" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center opacity-60 font-mono-code text-xs">
              <Users className="h-10 w-10 mb-2 opacity-50 text-orange-400" />
              <p>Select a friend from the list to start messaging.</p>
            </div>
          )}
        </div>
      </div>

      {/* 'Select a File' Picker Modal */}
      {showFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div
            className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-colors ${
              isLight
                ? 'bg-white border-amber-200 text-stone-900'
                : 'bg-[#140b07] border-orange-500/30 text-white'
            }`}
          >
            <button
              onClick={() => setShowFileModal(false)}
              className={`absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
                isLight ? 'border-amber-200 text-stone-500 hover:bg-amber-100' : 'border-orange-500/30 text-orange-200 hover:bg-[#24130c]'
              }`}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-4">
              <span className="font-mono-code text-[10px] uppercase font-bold text-[#ff6b00]">Attach Asset</span>
              <h3 className="font-sans text-lg font-bold">Select a File to Send</h3>
            </div>

            {/* Upload from computer option */}
            <div className="mb-4">
              <label
                className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-xl py-3 px-4 text-xs font-mono-code cursor-pointer transition-colors ${
                  isLight
                    ? 'border-amber-300 bg-amber-50 text-stone-700 hover:border-orange-500'
                    : 'border-orange-500/30 bg-[#1b0f0a] text-orange-200 hover:border-[#ff6b00]'
                }`}
              >
                <Upload className="h-4 w-4 text-[#ff6b00]" />
                <span>Upload file from computer</span>
                <input
                  type="file"
                  accept="image/*,.pdf,.zip"
                  onChange={handleLocalFileChosen}
                  className="hidden"
                />
              </label>
            </div>

            <p className="font-mono-code text-[10px] uppercase opacity-70 mb-2">
              Or pick from photography archive:
            </p>

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {photos.map(p => (
                <div
                  key={p.id}
                  onClick={() =>
                    handleSendFileAttachment({
                      id: p.id,
                      name: `${p.title.replace(/\s+/g, '_')}.jpg`,
                      url: p.url,
                      size: p.fileSize || '14.2 MB',
                      type: 'image/jpeg',
                    })
                  }
                  className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                    isLight
                      ? 'border-amber-200 bg-amber-50 hover:border-orange-500'
                      : 'border-orange-500/20 bg-[#1b0f0a] hover:border-[#ff6b00]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img src={p.url} alt={p.title} className="h-8 w-8 rounded object-cover grayscale" />
                    <div>
                      <p className="text-xs font-semibold truncate max-w-[180px]">{p.title}</p>
                      <p className="font-mono-code text-[10px] opacity-70">{p.fileSize || '14 MB'}</p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-[#ff6b00] px-3 py-0.5 text-[10px] font-mono-code font-bold text-black">
                    Attach →
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 'Select a Folder' Picker Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div
            className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-colors ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-[#12131a] border-neutral-800 text-white'
            }`}
          >
            <button
              onClick={() => setShowFolderModal(false)}
              className={`absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
                isLight ? 'border-slate-200 text-slate-500 hover:bg-slate-100' : 'border-neutral-800 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-4">
              <span className="font-mono-code text-[10px] uppercase font-bold text-cyan-600">Attach Entire Folder</span>
              <h3 className="font-sans text-lg font-bold">Select a Folder to Send</h3>
            </div>

            {/* Upload folder from computer via webkitdirectory */}
            <div className="mb-4">
              <label
                className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-xl py-3 px-4 text-xs font-mono-code cursor-pointer transition-colors ${
                  isLight
                    ? 'border-cyan-300 bg-cyan-50/50 text-cyan-800 hover:border-cyan-500'
                    : 'border-cyan-800/80 bg-cyan-950/20 text-cyan-300 hover:border-cyan-400'
                }`}
              >
                <Upload className="h-4 w-4 text-cyan-600" />
                <span>Upload a folder from computer</span>
                {/* @ts-ignore */}
                <input
                  type="file"
                  // @ts-expect-error webkitdirectory
                  webkitdirectory=""
                  directory=""
                  multiple
                  onChange={handleLocalFolderChosen}
                  className="hidden"
                />
              </label>
            </div>

            <p className="font-mono-code text-[10px] uppercase opacity-70 mb-2">
              Or send an album folder from your studio:
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {projects.map(proj => {
                const projPhotos = photos.filter(p => p.projectId === proj.id);
                return (
                  <div
                    key={proj.id}
                    onClick={() => {
                      const compiled = projPhotos.map(p => ({
                        id: p.id,
                        name: `${p.title.replace(/\s+/g, '_')}.jpg`,
                        url: p.url,
                        size: p.fileSize || '14.2 MB',
                        type: 'image/jpeg',
                        folderPath: proj.title,
                      }));
                      handleSendFolderAttachment(proj.title, compiled);
                    }}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      isLight
                        ? 'border-slate-200 bg-slate-50 hover:border-cyan-500'
                        : 'border-neutral-800 bg-neutral-900/60 hover:border-cyan-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Folder className="h-6 w-6 text-cyan-600 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold">{proj.title}</p>
                        <p className="font-mono-code text-[10px] opacity-70">
                          {projPhotos.length} photos • {proj.category}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-[10px] font-mono-code text-white">
                      Send Folder →
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Friend Requests Hub Modal */}
      <FriendRequestsModal
        isOpen={isRequestsModalOpen}
        onClose={() => setIsRequestsModalOpen(false)}
      />
    </section>
  );
};
