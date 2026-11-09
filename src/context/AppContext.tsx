import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import {
  User,
  Project,
  Photo,
  FileTransferPackage,
  FriendRequest,
  ChatMessage,
  ChatAttachment,
  PublishedPackage,
  FriendGroup,
  GroupPrivacySetting,
  ThemeId,
  UserSettings,
  ActiveSession,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_PROJECTS,
  INITIAL_PHOTOS,
  INITIAL_TRANSFERS,
  INITIAL_FRIEND_REQUESTS,
  INITIAL_CHAT_MESSAGES,
  INITIAL_PUBLISHED_PACKAGES,
} from '../data/mockData';
import { validateUsername, validatePassword, hashPassword } from '../utils/auth';
import { createTransferPackage, CreateTransferInput } from '../utils/transfer';
import { createFriendRequest, createChatMessage } from '../utils/friends';
import { createPublishedPackage, togglePackageLike, CreatePublishedInput } from '../utils/published';
import { createFriendGroup, canAddToGroup } from '../utils/groups';
import { applyThemeToDocument, DEFAULT_THEME_ID } from '../utils/themes';
import { apiUrl, apiFetch } from '../utils/api';

interface AppContextType {
  // Data
  users: User[];
  currentUser: User | null;
  projects: Project[];
  photos: Photo[];
  transfers: FileTransferPackage[];
  friendRequests: FriendRequest[];
  chatMessages: ChatMessage[];
  groups: FriendGroup[];

  // Navigation & Views
  activeTab: 'transfers' | 'friends' | 'published' | 'settings' | 'explore';
  setActiveTab: (tab: 'transfers' | 'friends' | 'published' | 'settings' | 'explore') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Theme Customization & Atmosphere
  selectedTheme: ThemeId;
  setThemeAction: (themeId: ThemeId) => Promise<void>;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  seasonalEffectsEnabled: boolean;
  setSeasonalEffectsEnabled: (enabled: boolean) => void;

  // Custom Avatar & Profile Actions
  isAvatarEditorOpen: boolean;
  setIsAvatarEditorOpen: (open: boolean) => void;
  updateCustomAvatarAction: (avatarDataUrl: string | null) => Promise<{ success: boolean; error?: string }>;
  updateUserSettingsAction: (
    newSettings: Partial<UserSettings>,
    profileUpdates?: { displayName?: string; bio?: string; location?: string }
  ) => Promise<{ success: boolean; error?: string }>;
  changePasswordAction: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;

  // Group Invitation Privacy Setting
  groupPrivacy: GroupPrivacySetting;
  setGroupPrivacyAction: (privacy: GroupPrivacySetting) => Promise<void>;

  // Friend Groups Management
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;
  createGroupAction: (name: string, members?: string[]) => Promise<{ success: boolean; group?: FriendGroup; error?: string }>;
  renameGroupAction: (groupId: string, name: string) => Promise<{ success: boolean; error?: string }>;
  deleteGroupAction: (groupId: string) => Promise<{ success: boolean; error?: string }>;
  addMemberToGroupAction: (groupId: string, username: string) => Promise<{ success: boolean; error?: string }>;
  removeMemberFromGroupAction: (groupId: string, username: string) => Promise<{ success: boolean; error?: string }>;

  // Auth Modals & Actions
  authModal: 'signin' | 'signup' | null;
  setAuthModal: (modal: 'signin' | 'signup' | null) => void;
  signUp: (data: {
    username: string;
    password: string;
    bio?: string;
    location?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  signIn: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  switchUserQuick: (username: string) => void;
  searchAccountsGlobally: (query: string) => Promise<User[]>;
  isRestoringSession: boolean;
  activeSessions: ActiveSession[];
  refreshSessionsAction: () => Promise<void>;
  revokeSessionAction: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
  signOutAllSessionsAction: () => Promise<{ success: boolean; error?: string }>;

  // Transfers
  isTransferModalOpen: boolean;
  setIsTransferModalOpen: (open: boolean) => void;
  sendTransfer: (input: CreateTransferInput) => { success: boolean; packageId?: string; error?: string };
  revokeTransfer: (id: string) => void;
  recordDownload: (id: string) => void;
  toggleFavoriteTransferAction: (packageId: string) => Promise<void>;
  activeTransferPortalId: string | null;
  setActiveTransferPortalId: (id: string | null) => void;

  // Friends & Chat
  activeChatFriend: string | null;
  setActiveChatFriend: (username: string | null) => void;
  sendFriendRequestAction: (toUsername: string) => Promise<{ success: boolean; error?: string }>;
  acceptFriendRequestAction: (requestId: string) => void;
  declineFriendRequestAction: (requestId: string) => void;
  cancelFriendRequestAction: (requestId: string) => void;
  sendChatMessageAction: (recipientUsername: string, text: string, attachment?: ChatAttachment) => void;

  // Published Community Files & Vault Packages
  publishedPackages: PublishedPackage[];
  publishPackageAction: (input: CreatePublishedInput) => { success: boolean; package?: PublishedPackage; error?: string };
  editPublishedPackageAction: (id: string, updates: Partial<PublishedPackage>) => Promise<{ success: boolean; error?: string }>;
  deletePublishedPackageAction: (id: string) => Promise<{ success: boolean; error?: string }>;
  reportPackageAction: (packageId: string, reason: string, details?: string) => Promise<{ success: boolean; error?: string }>;
  recordPublishedDownload: (id: string) => void;
  togglePublishedLikeAction: (id: string) => void;
  isPublishModalOpen: boolean;
  setIsPublishModalOpen: (open: boolean) => void;

  // Media Preview & Reporting modals
  activeReportModalPackage: PublishedPackage | null;
  setActiveReportModalPackage: (pkg: PublishedPackage | null) => void;
  activePreviewMedia: { url: string; title: string; type: 'image' | 'video' } | null;
  setActivePreviewMedia: (media: { url: string; title: string; type: 'image' | 'video' } | null) => void;

  // Legacy compat stubs
  selectedPhotographer: User | null;
  setSelectedPhotographer: (user: User | null) => void;
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  lightboxPhoto: Photo | null;
  setLightboxPhoto: (photo: Photo | null) => void;
  gridLayout: any;
  setGridLayout: (layout: any) => void;
  selectedCategory: any;
  setSelectedCategory: (cat: any) => void;
  isAvatarModalOpen: boolean;
  setIsAvatarModalOpen: (open: boolean) => void;
  updateUserAvatar: (avatar: string) => Promise<void>;
  createProject: (data: any) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addPhoto: (photo: any) => Photo;
  deletePhoto: (id: string) => void;
  updatePhoto: (id: string, updates: Partial<Photo>) => void;
  preselectedTransferProject: Project | null;
  openTransferModalForProject: (project: Project) => void;
  addTransferReview: (id: string, review: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);


const STORAGE_KEY_USERS = 'noir_archive_users_v6';
const STORAGE_KEY_CURRENT_USER = 'noir_archive_current_user_v6';
const STORAGE_KEY_GROUPS = 'noir_archive_groups_v6';
const STORAGE_KEY_TRANSFERS = 'noir_archive_transfers_v6';
const STORAGE_KEY_THEME = 'noir_archive_theme_v6';
const STORAGE_KEY_FRIEND_REQUESTS = 'noir_archive_friend_requests_v6';
const STORAGE_KEY_CHAT_MESSAGES = 'noir_archive_chat_messages_v6';
const STORAGE_KEY_PUBLISHED = 'noir_archive_published_v6';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USERS);
      const parsed: User[] = stored ? JSON.parse(stored) : [];
      const userMap = new Map<string, User>();
      INITIAL_USERS.forEach(u => userMap.set(u.username.toLowerCase(), u));
      parsed.forEach(u => {
        const def = userMap.get(u.username.toLowerCase());
        userMap.set(u.username.toLowerCase(), {
          ...def,
          ...u,
          avatar: '', // Strict letter-based avatars: no human photos
          selectedTheme: u.selectedTheme || def?.selectedTheme || 'graphite',
          groupPrivacy: u.groupPrivacy || def?.groupPrivacy || 'friends',
        });
      });
      return Array.from(userMap.values());
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.avatar = ''; // Ensure no human avatar
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(true);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);

  const [groups, setGroups] = useState<FriendGroup[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_GROUPS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [transfers, setTransfers] = useState<FileTransferPackage[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TRANSFERS);
      return stored ? JSON.parse(stored) : INITIAL_TRANSFERS;
    } catch {
      return INITIAL_TRANSFERS;
    }
  });

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_FRIEND_REQUESTS);
      return stored ? JSON.parse(stored) : INITIAL_FRIEND_REQUESTS;
    } catch {
      return INITIAL_FRIEND_REQUESTS;
    }
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CHAT_MESSAGES);
      return stored ? JSON.parse(stored) : INITIAL_CHAT_MESSAGES;
    } catch {
      return INITIAL_CHAT_MESSAGES;
    }
  });

  const [publishedPackages, setPublishedPackages] = useState<PublishedPackage[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PUBLISHED);
      return stored ? JSON.parse(stored) : INITIAL_PUBLISHED_PACKAGES;
    } catch {
      return INITIAL_PUBLISHED_PACKAGES;
    }
  });

  // UI Navigation
  const [activeTab, setActiveTabState] = useState<'transfers' | 'friends' | 'published' | 'settings' | 'explore'>('transfers');
  const [searchQuery, setSearchQuery] = useState('');
  const [authModal, setAuthModal] = useState<'signin' | 'signup' | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [activeTransferPortalId, setActiveTransferPortalId] = useState<string | null>(null);
  const [activeChatFriend, setActiveChatFriend] = useState<string | null>('elena_k');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  // Selected Theme (default: Graphite)
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_THEME) as ThemeId;
      return stored || currentUser?.selectedTheme || DEFAULT_THEME_ID;
    } catch {
      return DEFAULT_THEME_ID;
    }
  });

  // Group Invitation Privacy Setting (default: 'friends')
  const [groupPrivacy, setGroupPrivacy] = useState<GroupPrivacySetting>(() => {
    return currentUser?.groupPrivacy || 'friends';
  });

  // Map 'explore' tab directly to 'transfers'
  const setActiveTab = (tab: 'transfers' | 'friends' | 'published' | 'settings' | 'explore') => {
    setActiveTabState(tab === 'explore' ? 'transfers' : tab);
  };

  // Keep theme synced across document & storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, selectedTheme);
      applyThemeToDocument(selectedTheme);
    } catch (e) {
      console.warn('Theme apply error', e);
    }
  }, [selectedTheme]);

  // When currentUser changes, restore their saved theme and group privacy
  useEffect(() => {
    if (currentUser) {
      if (currentUser.selectedTheme && currentUser.selectedTheme !== selectedTheme) {
        setSelectedTheme(currentUser.selectedTheme);
      }
      if (currentUser.groupPrivacy && currentUser.groupPrivacy !== groupPrivacy) {
        setGroupPrivacy(currentUser.groupPrivacy);
      }
    }
  }, [currentUser?.username]);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
      localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groups));
      localStorage.setItem(STORAGE_KEY_TRANSFERS, JSON.stringify(transfers));
      localStorage.setItem(STORAGE_KEY_FRIEND_REQUESTS, JSON.stringify(friendRequests));
      localStorage.setItem(STORAGE_KEY_CHAT_MESSAGES, JSON.stringify(chatMessages));
      localStorage.setItem(STORAGE_KEY_PUBLISHED, JSON.stringify(publishedPackages));
      if (currentUser) {
        const { passwordHash, ...safeUser } = currentUser as any;
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(safeUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      }
    } catch {}
  }, [users, groups, transfers, friendRequests, chatMessages, publishedPackages, currentUser]);

  const currentUserRef = useRef<User | null>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Server-Sent Events (SSE) & Periodic Synchronization
  useEffect(() => {
    let isMounted = true;
    let es: EventSource | null = null;

    try {
      es = new EventSource(apiUrl('/api/events'));

      es.addEventListener('new_message', (e) => {
        try {
          const msg: ChatMessage = JSON.parse(e.data);
          if (isMounted) {
            setChatMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]));
          }
        } catch {}
      });

      es.addEventListener('friend_request_created', (e) => {
        try {
          const req: FriendRequest = JSON.parse(e.data);
          if (isMounted) {
            setFriendRequests(prev => (prev.some(r => r.id === req.id) ? prev : [req, ...prev]));
          }
        } catch {}
      });

      es.addEventListener('friend_request_accepted', (e) => {
        try {
          const { id, users: updatedUsers } = JSON.parse(e.data);
          if (isMounted) {
            setFriendRequests(prev => prev.map(r => (r.id === id ? { ...r, status: 'accepted' } : r)));
            if (Array.isArray(updatedUsers)) {
              setUsers(prev => {
                const map = new Map<string, User>();
                prev.forEach(u => map.set(u.username.toLowerCase(), u));
                updatedUsers.forEach((u: User) => {
                  const ex = map.get(u.username.toLowerCase());
                  map.set(u.username.toLowerCase(), {
                    ...u,
                    avatar: '',
                    passwordHash: ex?.passwordHash || hashPassword('password123'),
                    friends: u.friends || [],
                  });
                });
                return Array.from(map.values());
              });
            }
          }
        } catch {}
      });

      es.addEventListener('friend_request_declined', (e) => {
        try {
          const { id } = JSON.parse(e.data);
          if (isMounted) setFriendRequests(prev => prev.map(r => (r.id === id ? { ...r, status: 'declined' } : r)));
        } catch {}
      });

      es.addEventListener('friend_request_cancelled', (e) => {
        try {
          const { id } = JSON.parse(e.data);
          if (isMounted) setFriendRequests(prev => prev.filter(r => r.id !== id));
        } catch {}
      });

      es.addEventListener('group_created', (e) => {
        try {
          const grp: FriendGroup = JSON.parse(e.data);
          if (isMounted) {
            setGroups(prev => (prev.some(g => g.id === grp.id) ? prev : [grp, ...prev]));
          }
        } catch {}
      });

      es.addEventListener('group_updated', (e) => {
        try {
          const grp: FriendGroup = JSON.parse(e.data);
          if (isMounted) {
            setGroups(prev => prev.map(g => (g.id === grp.id ? grp : g)));
          }
        } catch {}
      });

      es.addEventListener('group_deleted', (e) => {
        try {
          const { id } = JSON.parse(e.data);
          if (isMounted) {
            setGroups(prev => prev.filter(g => g.id !== id));
            if (activeGroupId === id) setActiveGroupId(null);
          }
        } catch {}
      });

      es.addEventListener('new_transfer', (e) => {
        try {
          const pkg: FileTransferPackage = JSON.parse(e.data);
          if (isMounted) {
            setTransfers(prev => {
              const idx = prev.findIndex(t => t.id === pkg.id);
              if (idx >= 0) {
                const copy = [...prev];
                copy[idx] = pkg;
                return copy;
              }
              return [pkg, ...prev];
            });
          }
        } catch {}
      });

      es.addEventListener('transfer_downloaded', (e) => {
        try {
          const { id, downloadsCount } = JSON.parse(e.data);
          if (isMounted) {
            setTransfers(prev => prev.map(t => (t.id === id ? { ...t, downloadsCount } : t)));
          }
        } catch {}
      });

      es.addEventListener('transfer_revoked', (e) => {
        try {
          const { id } = JSON.parse(e.data);
          if (isMounted) {
            setTransfers(prev => prev.map(t => (t.id === id ? { ...t, status: 'revoked' } : t)));
          }
        } catch {}
      });

      es.addEventListener('new_published', (e) => {
        try {
          const pkg: PublishedPackage = JSON.parse(e.data);
          if (isMounted) {
            setPublishedPackages(prev => [pkg, ...prev.filter(p => p.id !== pkg.id)]);
          }
        } catch {}
      });

      es.addEventListener('user_registered', (e) => {
        try {
          const u: User = JSON.parse(e.data);
          if (isMounted) {
            setUsers(prev => (prev.some(item => item.username.toLowerCase() === u.username.toLowerCase()) ? prev : [...prev, { ...u, avatar: '' }]));
          }
        } catch {}
      });

      es.addEventListener('user_updated', (e) => {
        try {
          const u: User = JSON.parse(e.data);
          if (isMounted) {
            setUsers(prev => prev.map(item => (item.username.toLowerCase() === u.username.toLowerCase() ? { ...item, ...u, avatar: '' } : item)));
            if (currentUserRef.current?.username.toLowerCase() === u.username.toLowerCase()) {
              setCurrentUser(prev => (prev ? { ...prev, ...u, avatar: '' } : null));
            }
          }
        } catch {}
      });
    } catch {}

    const syncWithServer = async () => {
      try {
        // Sync users
        const usersRes = await fetch(apiUrl('/api/users'));
        if (usersRes.ok) {
          const serverUsers: User[] = await usersRes.json();
          if (isMounted && Array.isArray(serverUsers) && serverUsers.length > 0) {
            setUsers(prev => {
              const map = new Map<string, User>();
              INITIAL_USERS.forEach(u => map.set(u.username.toLowerCase(), u));
              prev.forEach(u => map.set(u.username.toLowerCase(), u));
              serverUsers.forEach(u => {
                const ex = map.get(u.username.toLowerCase());
                map.set(u.username.toLowerCase(), {
                  ...u,
                  avatar: '',
                  passwordHash: ex?.passwordHash || hashPassword('password123'),
                  friends: Array.from(new Set([...(ex?.friends || []), ...(u.friends || [])])),
                  selectedTheme: u.selectedTheme || ex?.selectedTheme || 'graphite',
                  groupPrivacy: u.groupPrivacy || ex?.groupPrivacy || 'friends',
                });
              });
              return Array.from(map.values());
            });

            const me = currentUserRef.current;
            if (me) {
              const freshMe = serverUsers.find(u => u.username.toLowerCase() === me.username.toLowerCase());
              if (freshMe) {
                setCurrentUser(prev => (prev ? { ...prev, ...freshMe, avatar: '' } : null));
              }
            }
          }
        }

        // Sync friend requests
        const reqRes = await fetch(apiUrl('/api/friend-requests'));
        if (reqRes.ok) {
          const serverRequests = await reqRes.json();
          if (isMounted && Array.isArray(serverRequests)) {
            setFriendRequests(serverRequests);
          }
        }

        // Sync groups
        const userParam = currentUserRef.current ? `?user=${encodeURIComponent(currentUserRef.current.username)}` : '';
        const groupsRes = await fetch(apiUrl(`/api/groups${userParam}`));
        if (groupsRes.ok) {
          const serverGroups: FriendGroup[] = await groupsRes.json();
          if (isMounted && Array.isArray(serverGroups)) {
            setGroups(serverGroups);
          }
        }

        // Sync chat messages
        const chatRes = await fetch(apiUrl('/api/chat-messages'));
        if (chatRes.ok) {
          const serverMessages: ChatMessage[] = await chatRes.json();
          if (isMounted && Array.isArray(serverMessages)) {
            setChatMessages(serverMessages);
          }
        }

        // Sync transfers
        const transferRes = await fetch(apiUrl('/api/transfers'));
        if (transferRes.ok) {
          const serverTransfers: FileTransferPackage[] = await transferRes.json();
          if (isMounted && Array.isArray(serverTransfers)) {
            setTransfers(serverTransfers);
          }
        }

        // Sync published packages
        const pubRes = await fetch(apiUrl('/api/published'));
        if (pubRes.ok) {
          const serverPub: PublishedPackage[] = await pubRes.json();
          if (isMounted && Array.isArray(serverPub)) {
            setPublishedPackages(serverPub);
          }
        }
      } catch {}
    };

    syncWithServer();
    const interval = setInterval(syncWithServer, 3000);
    window.addEventListener('focus', syncWithServer);

    return () => {
      isMounted = false;
      if (es) es.close();
      clearInterval(interval);
      window.removeEventListener('focus', syncWithServer);
    };
  }, []);

  // Theme update action
  const setThemeAction = async (themeId: ThemeId) => {
    setSelectedTheme(themeId);
    applyThemeToDocument(themeId);
    if (currentUser) {
      setCurrentUser(prev => (prev ? { ...prev, selectedTheme: themeId } : null));
      setUsers(prev =>
        prev.map(u => (u.username.toLowerCase() === currentUser.username.toLowerCase() ? { ...u, selectedTheme: themeId } : u))
      );
      try {
        await fetch(apiUrl(`/api/users/${encodeURIComponent(currentUser.username)}/settings`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selectedTheme: themeId }),
        });
      } catch {}
    }
  };

  // Group privacy update action
  const setGroupPrivacyAction = async (privacy: GroupPrivacySetting) => {
    setGroupPrivacy(privacy);
    if (currentUser) {
      setCurrentUser(prev => (prev ? { ...prev, groupPrivacy: privacy } : null));
      setUsers(prev =>
        prev.map(u => (u.username.toLowerCase() === currentUser.username.toLowerCase() ? { ...u, groupPrivacy: privacy } : u))
      );
      try {
        await fetch(apiUrl(`/api/users/${encodeURIComponent(currentUser.username)}/settings`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupPrivacy: privacy }),
        });
      } catch {}
    }
  };

  // Friend Groups Management
  const createGroupAction = async (name: string, members: string[] = []) => {
    if (!currentUser) return { success: false, error: 'Must be logged in to create a group.' };
    const cleanName = name.trim();
    if (!cleanName) return { success: false, error: 'Group name is required.' };

    try {
      const res = await fetch(apiUrl('/api/groups'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          ownerUsername: currentUser.username,
          members: [currentUser.username, ...members],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || 'Failed to create group.' };
      }

      const data = await res.json();
      if (data.group) {
        setGroups(prev => [data.group, ...prev.filter(g => g.id !== data.group.id)]);
        setActiveGroupId(data.group.id);
        return { success: true, group: data.group };
      }
      return { success: true };
    } catch {
      // Local fallback
      const grp = createFriendGroup(currentUser.username, cleanName, members);
      setGroups(prev => [grp, ...prev]);
      setActiveGroupId(grp.id);
      return { success: true, group: grp };
    }
  };

  const renameGroupAction = async (groupId: string, name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return { success: false, error: 'Group name is required.' };

    setGroups(prev => prev.map(g => (g.id === groupId ? { ...g, name: cleanName, updatedAt: new Date().toISOString() } : g)));

    try {
      const res = await fetch(apiUrl(`/api/groups/${encodeURIComponent(groupId)}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || 'Failed to rename group.' };
      }
      return { success: true };
    } catch {
      return { success: true };
    }
  };

  const deleteGroupAction = async (groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    if (activeGroupId === groupId) setActiveGroupId(null);

    try {
      await fetch(apiUrl(`/api/groups/${encodeURIComponent(groupId)}`), { method: 'DELETE' });
      return { success: true };
    } catch {
      return { success: true };
    }
  };

  const addMemberToGroupAction = async (groupId: string, targetUsername: string) => {
    if (!currentUser) return { success: false, error: 'Sign in to manage groups.' };
    const cleanTarget = targetUsername.replace(/^@/, '').trim().toLowerCase();

    // Check existence & privacy first
    let targetUser = users.find(u => u.username.toLowerCase() === cleanTarget);
    if (!targetUser) {
      try {
        const checkRes = await fetch(apiUrl(`/api/users/${encodeURIComponent(cleanTarget)}`));
        if (checkRes.ok) {
          targetUser = await checkRes.json();
        }
      } catch {}
    }

    if (!targetUser) {
      return { success: false, error: `User @${cleanTarget} does not exist.` };
    }

    // Client-side privacy check
    const check = canAddToGroup(targetUser, currentUser.username);
    if (!check.allowed) {
      return { success: false, error: check.error };
    }

    try {
      const res = await fetch(apiUrl(`/api/groups/${encodeURIComponent(groupId)}/members`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanTarget, adderUsername: currentUser.username }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || 'Failed to add friend to group.' };
      }

      const data = await res.json();
      if (data.group) {
        setGroups(prev => prev.map(g => (g.id === groupId ? data.group : g)));
      }
      return { success: true };
    } catch {
      setGroups(prev =>
        prev.map(g =>
          g.id === groupId
            ? { ...g, memberUsernames: Array.from(new Set([...g.memberUsernames, cleanTarget])) }
            : g
        )
      );
      return { success: true };
    }
  };

  const removeMemberFromGroupAction = async (groupId: string, memberUsername: string) => {
    const clean = memberUsername.replace(/^@/, '').trim().toLowerCase();
    setGroups(prev =>
      prev.map(g =>
        g.id === groupId
          ? { ...g, memberUsernames: g.memberUsernames.filter(m => m.toLowerCase() !== clean) }
          : g
      )
    );

    try {
      await fetch(apiUrl(`/api/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(clean)}`), {
        method: 'DELETE',
      });
      return { success: true };
    } catch {
      return { success: true };
    }
  };

  // Global search for user accounts across the platform
  const searchAccountsGlobally = async (query: string): Promise<User[]> => {
    const clean = query.trim().toLowerCase();
    const excludeParam = currentUser ? `&exclude=${encodeURIComponent(currentUser.username)}` : '';
    try {
      let remoteUsers: User[] | null = null;
      if (!clean) {
        const res = await fetch(apiUrl('/api/users'));
        if (res.ok) remoteUsers = await res.json();
      } else {
        const res1 = await fetch(apiUrl(`/api/users/search?q=${encodeURIComponent(clean)}${excludeParam}`));
        if (res1.ok) {
          remoteUsers = await res1.json();
        } else {
          const res2 = await fetch(apiUrl(`/api/users/search/${encodeURIComponent(clean)}`));
          if (res2.ok) remoteUsers = await res2.json();
        }
      }

      if (Array.isArray(remoteUsers)) {
        setUsers(prev => {
          const map = new Map<string, User>();
          prev.forEach(u => map.set(u.username.toLowerCase(), u));
          remoteUsers!.forEach(u => {
            const ex = map.get(u.username.toLowerCase());
            map.set(u.username.toLowerCase(), {
              ...u,
              avatar: '',
              passwordHash: ex?.passwordHash || hashPassword('password123'),
              friends: Array.from(new Set([...(ex?.friends || []), ...(u.friends || [])])),
              selectedTheme: u.selectedTheme || ex?.selectedTheme || 'graphite',
              groupPrivacy: u.groupPrivacy || ex?.groupPrivacy || 'friends',
            });
          });
          return Array.from(map.values());
        });

        return currentUser
          ? remoteUsers.filter(u => u.username.toLowerCase() !== currentUser.username.toLowerCase())
          : remoteUsers;
      }
    } catch {}

    return users.filter(
      u =>
        (!currentUser || u.username.toLowerCase() !== currentUser.username.toLowerCase()) &&
        u.username.toLowerCase().includes(clean)
    );
  };

  // Auth Operations
  const signUp = async (data: {
    username: string;
    password: string;
    bio?: string;
    location?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const userVal = validateUsername(data.username, users);
    if (!userVal.isValid) return { success: false, error: userVal.error };

    const passVal = validatePassword(data.password);
    if (!passVal.isValid) return { success: false, error: passVal.feedback };

    const cleanUsername = data.username.trim().toLowerCase();

    try {
      const res = await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          username: cleanUsername,
          password: data.password,
          bio: data.bio?.trim() || 'Noir Archive file sharing member.',
          location: data.location?.trim() || 'Worldwide',
          selectedTheme: 'graphite',
          groupPrivacy: 'friends',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || `Registration failed (HTTP ${res.status})` };
      }

      const resData = await res.json();
      if (!resData.user) return { success: false, error: 'Malformed server response' };

      const authenticatedUser: User = {
        ...resData.user,
        avatar: '',
        passwordHash: '', // Never store passwords or hashes in client session state
        friends: resData.user.friends || [],
        selectedTheme: 'graphite',
        groupPrivacy: 'friends',
      };

      setUsers(prev => [...prev.filter(u => u.username.toLowerCase() !== cleanUsername), authenticatedUser]);
      setCurrentUser(authenticatedUser);
      setAuthModal(null);
      setSelectedTheme('graphite');
      applyThemeToDocument('graphite');

      // Refresh active sessions list
      refreshSessionsAction();

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: 'Cannot connect to Noir Archive cloud service. Please check your internet connection.',
      };
    }
  };

  const signIn = async (username: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const normalized = username.trim().toLowerCase();

    try {
      const res = await apiFetch('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ username: normalized, password: pass }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const authenticatedUser: User = {
            ...data.user,
            avatar: '',
            passwordHash: '', // Never store passwords or hashes in client session state
            friends: data.user.friends || [],
            selectedTheme: data.user.selectedTheme || 'graphite',
            groupPrivacy: data.user.groupPrivacy || 'friends',
          };
          setUsers(prev => {
            const map = new Map<string, User>();
            prev.forEach(u => map.set(u.username.toLowerCase(), u));
            map.set(authenticatedUser.username.toLowerCase(), authenticatedUser);
            return Array.from(map.values());
          });
          setCurrentUser(authenticatedUser);
          setAuthModal(null);

          // Restore saved theme
          const userTheme = authenticatedUser.selectedTheme || 'graphite';
          setSelectedTheme(userTheme);
          applyThemeToDocument(userTheme);

          // Restore group privacy
          if (authenticatedUser.groupPrivacy) {
            setGroupPrivacy(authenticatedUser.groupPrivacy);
          }

          // Refresh active sessions list
          refreshSessionsAction();

          return { success: true };
        }
      }

      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || 'Invalid username or password' };
    } catch {
      return {
        success: false,
        error: 'Cannot connect to Noir Archive service. Please check your connection.',
      };
    }
  };

  const signOut = async () => {
    try {
      await apiFetch('/api/auth/signout', { method: 'POST' });
    } catch (err) {
      console.warn('Signout request error:', err);
    } finally {
      setCurrentUser(null);
      setActiveSessions([]);
      try {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
        sessionStorage.clear();
      } catch {}
    }
  };

  const signOutAllSessionsAction = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiFetch('/api/auth/signout-all', { method: 'POST' });
    } catch (err) {
      console.warn('Signout all request error:', err);
    } finally {
      setCurrentUser(null);
      setActiveSessions([]);
      try {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
        sessionStorage.clear();
      } catch {}
    }
    return { success: true };
  };

  const refreshSessionsAction = async () => {
    try {
      const res = await apiFetch('/api/auth/sessions');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.sessions)) {
          setActiveSessions(data.sessions);
        }
      }
    } catch {
      // ignore
    }
  };

  const revokeSessionAction = async (sessionId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await apiFetch(`/api/auth/sessions/${sessionId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to revoke session' };
    } catch {
      return { success: false, error: 'Network error revoking session' };
    }
  };

  // Restore authenticated session automatically across browser refreshes, tabs, or restarts
  useEffect(() => {
    let isMounted = true;

    async function restorePersistentSession() {
      try {
        const res = await apiFetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            if (isMounted) {
              const authUser: User = {
                ...data.user,
                avatar: '',
                passwordHash: '',
                friends: data.user.friends || [],
                selectedTheme: data.user.selectedTheme || 'graphite',
                groupPrivacy: data.user.groupPrivacy || 'friends',
              };

              setUsers(prev => {
                const map = new Map<string, User>();
                prev.forEach(u => map.set(u.username.toLowerCase(), u));
                map.set(authUser.username.toLowerCase(), authUser);
                return Array.from(map.values());
              });

              setCurrentUser(authUser);

              if (authUser.selectedTheme) {
                setSelectedTheme(authUser.selectedTheme);
                applyThemeToDocument(authUser.selectedTheme);
              }
              if (authUser.groupPrivacy) {
                setGroupPrivacy(authUser.groupPrivacy);
              }

              // Load active sessions list
              apiFetch('/api/auth/sessions')
                .then(r => r.json())
                .then(d => {
                  if (isMounted && Array.isArray(d.sessions)) {
                    setActiveSessions(d.sessions);
                  }
                })
                .catch(() => {});
            }
            return;
          }
        }

        // If backend returns not authenticated, clear state
        if (isMounted) {
          setCurrentUser(null);
          try {
            localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
            sessionStorage.clear();
          } catch {}
        }
      } catch (err) {
        console.warn('[Noir Archive] Session restoration check failed:', err);
      } finally {
        if (isMounted) {
          setIsRestoringSession(false);
        }
      }
    }

    restorePersistentSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const switchUserQuick = (username: string) => {
    const target = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (target) {
      setCurrentUser(target);
      if (target.selectedTheme) {
        setSelectedTheme(target.selectedTheme);
        applyThemeToDocument(target.selectedTheme);
      }
      if (target.groupPrivacy) {
        setGroupPrivacy(target.groupPrivacy);
      }
    }
  };

  // Transfers
  const sendTransfer = (input: CreateTransferInput) => {
    try {
      const pkg = createTransferPackage(input);
      setTransfers(prev => [pkg, ...prev]);

      try {
        fetch(apiUrl('/api/transfers'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pkg),
        }).catch(() => {});
      } catch {}

      return { success: true, packageId: pkg.id };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create transfer';
      return { success: false, error: msg };
    }
  };

  const revokeTransfer = (id: string) => {
    setTransfers(prev => prev.map(t => (t.id === id ? { ...t, status: 'revoked' } : t)));
    try {
      fetch(apiUrl(`/api/transfers/${encodeURIComponent(id)}/revoke`), { method: 'POST' }).catch(() => {});
    } catch {}
  };

  const recordDownload = (id: string) => {
    setTransfers(prev => prev.map(t => (t.id === id ? { ...t, downloadsCount: t.downloadsCount + 1 } : t)));
    try {
      fetch(apiUrl(`/api/transfers/${encodeURIComponent(id)}/download`), { method: 'POST' }).catch(() => {});
    } catch {}
  };

  // Friend Requests
  const sendFriendRequestAction = async (toUsername: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Sign in to add friends.' };
    const cleanTo = toUsername.replace(/^@/, '').trim().toLowerCase();
    if (!cleanTo) return { success: false, error: 'Recipient username is required.' };

    if (cleanTo === currentUser.username.toLowerCase()) {
      return { success: false, error: 'You cannot send a friend request to yourself.' };
    }

    if ((currentUser.friends || []).map(f => f.toLowerCase()).includes(cleanTo)) {
      return { success: false, error: `@${cleanTo} is already in your friends list.` };
    }

    let targetUser = users.find(u => u.username.toLowerCase() === cleanTo);
    if (!targetUser) {
      targetUser = INITIAL_USERS.find(u => u.username.toLowerCase() === cleanTo);
      if (targetUser) setUsers(prev => [...prev, targetUser!]);
    }

    if (!targetUser) {
      try {
        const checkRes = await fetch(apiUrl(`/api/users/${encodeURIComponent(cleanTo)}`));
        if (checkRes.ok) {
          const sUser = await checkRes.json();
          if (sUser && sUser.username) {
            targetUser = sUser;
            setUsers(prev => [...prev.filter(u => u.username.toLowerCase() !== sUser.username.toLowerCase()), sUser]);
          }
        }
      } catch {}
    }

    if (!targetUser) {
      return { success: false, error: `User @${cleanTo} does not exist.` };
    }

    const alreadyPending = friendRequests.some(
      r =>
        r.status === 'pending' &&
        ((r.fromUsername.toLowerCase() === currentUser.username.toLowerCase() &&
          r.toUsername.toLowerCase() === targetUser!.username.toLowerCase()) ||
          (r.fromUsername.toLowerCase() === targetUser!.username.toLowerCase() &&
            r.toUsername.toLowerCase() === currentUser.username.toLowerCase()))
    );

    if (alreadyPending) {
      return { success: false, error: `A friend request to @${targetUser.username} is already pending.` };
    }

    try {
      const res = await fetch(apiUrl('/api/friend-requests'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUsername: currentUser.username, toUsername: targetUser.username }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || `Failed to send friend request (HTTP ${res.status})` };
      }

      const data = await res.json();
      if (data.request) {
        setFriendRequests(prev => [data.request, ...prev.filter(r => r.id !== data.request.id)]);
      }
      return { success: true };
    } catch {
      const fallbackReq = createFriendRequest(currentUser.username, targetUser.username);
      setFriendRequests(prev => [fallbackReq, ...prev]);
      return { success: true };
    }
  };

  const cancelFriendRequestAction = (requestId: string) => {
    try {
      fetch(apiUrl(`/api/friend-requests/${encodeURIComponent(requestId)}/cancel`), { method: 'POST' }).catch(() => {});
    } catch {}
    setFriendRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const acceptFriendRequestAction = (requestId: string) => {
    const req = friendRequests.find(r => r.id === requestId);
    if (!req || !currentUser) return;

    try {
      fetch(apiUrl(`/api/friend-requests/${encodeURIComponent(requestId)}/accept`), { method: 'POST' }).catch(() => {});
    } catch {}

    setFriendRequests(prev => prev.map(r => (r.id === requestId ? { ...r, status: 'accepted' } : r)));
    const friendName = req.fromUsername.toLowerCase() === currentUser.username.toLowerCase()
      ? req.toUsername
      : req.fromUsername;

    setUsers(prev =>
      prev.map(u => {
        if (u.username.toLowerCase() === currentUser.username.toLowerCase()) {
          return { ...u, friends: Array.from(new Set([...(u.friends || []), friendName])) };
        }
        if (u.username.toLowerCase() === friendName.toLowerCase()) {
          return { ...u, friends: Array.from(new Set([...(u.friends || []), currentUser.username])) };
        }
        return u;
      })
    );

    setCurrentUser(prev =>
      prev ? { ...prev, friends: Array.from(new Set([...(prev.friends || []), friendName])) } : null
    );
  };

  const declineFriendRequestAction = (requestId: string) => {
    try {
      fetch(apiUrl(`/api/friend-requests/${encodeURIComponent(requestId)}/decline`), { method: 'POST' }).catch(() => {});
    } catch {}
    setFriendRequests(prev => prev.map(r => (r.id === requestId ? { ...r, status: 'declined' } : r)));
  };

  const sendChatMessageAction = (
    recipientUsername: string,
    text: string,
    attachment?: ChatAttachment
  ) => {
    if (!currentUser) return;
    const msg = createChatMessage(currentUser.username, recipientUsername, text, attachment);
    setChatMessages(prev => [...prev.filter(m => m.id !== msg.id), msg]);

    try {
      fetch(apiUrl('/api/chat-messages'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: msg.id,
          senderUsername: currentUser.username,
          recipientUsername,
          text,
          attachment,
        }),
      }).catch(() => {});
    } catch {}
  };

  // Published Files Actions
  const publishPackageAction = (input: CreatePublishedInput) => {
    try {
      const pkg = createPublishedPackage(input);
      setPublishedPackages(prev => [pkg, ...prev]);

      try {
        fetch(apiUrl('/api/published'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pkg),
        }).catch(() => {});
      } catch {}

      return { success: true, package: pkg };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to publish files' };
    }
  };

  const recordPublishedDownload = (id: string) => {
    setPublishedPackages(prev =>
      prev.map(p => (p.id === id ? { ...p, downloadsCount: p.downloadsCount + 1 } : p))
    );
    try {
      fetch(apiUrl(`/api/published/${encodeURIComponent(id)}/download`), { method: 'POST' }).catch(() => {});
    } catch {}
  };

  const togglePublishedLikeAction = (id: string) => {
    const username = currentUser?.username || 'member';
    setPublishedPackages(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const { updatedPackage } = togglePackageLike(p, username);
        return updatedPackage;
      })
    );
    try {
      fetch(apiUrl(`/api/published/${encodeURIComponent(id)}/like`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      }).catch(() => {});
    } catch {}
  };

  // Seasonal effects toggle
  const [seasonalEffectsEnabled, setSeasonalEffectsEnabledState] = useState<boolean>(() => {
    return currentUser?.settings?.seasonalEffectsEnabled !== false;
  });

  const setSeasonalEffectsEnabled = (enabled: boolean) => {
    setSeasonalEffectsEnabledState(enabled);
    if (currentUser) {
      updateUserSettingsAction({ seasonalEffectsEnabled: enabled });
    }
  };

  // Modals
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);
  const [activeReportModalPackage, setActiveReportModalPackage] = useState<PublishedPackage | null>(null);
  const [activePreviewMedia, setActivePreviewMedia] = useState<{ url: string; title: string; type: 'image' | 'video' } | null>(null);

  // Update Custom Avatar
  const updateCustomAvatarAction = async (avatarDataUrl: string | null): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Sign in to customize your profile picture.' };
    const cleanUsername = currentUser.username.toLowerCase();

    try {
      const res = await fetch(apiUrl(`/api/users/${encodeURIComponent(cleanUsername)}/settings`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customAvatar: avatarDataUrl || '' }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || 'Failed to update avatar' };
      }

      const updatedUser: User = {
        ...currentUser,
        customAvatar: avatarDataUrl || undefined,
      };

      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => (u.username.toLowerCase() === cleanUsername ? updatedUser : u)));
      return { success: true };
    } catch {
      const updatedUser: User = {
        ...currentUser,
        customAvatar: avatarDataUrl || undefined,
      };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => (u.username.toLowerCase() === cleanUsername ? updatedUser : u)));
      return { success: true };
    }
  };

  // Update User Settings (matureContentFilter, notificationSounds, defaultExpiryDays, etc. + bio/location/displayName)
  const updateUserSettingsAction = async (
    newSettings: Partial<UserSettings>,
    profileUpdates?: { displayName?: string; bio?: string; location?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };
    const cleanUsername = currentUser.username.toLowerCase();

    const mergedSettings = { ...(currentUser.settings || {}), ...newSettings };
    const updatedUser: User = {
      ...currentUser,
      displayName: profileUpdates?.displayName !== undefined ? profileUpdates.displayName : currentUser.displayName,
      bio: profileUpdates?.bio !== undefined ? profileUpdates.bio : currentUser.bio,
      location: profileUpdates?.location !== undefined ? profileUpdates.location : currentUser.location,
      settings: mergedSettings,
    };

    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => (u.username.toLowerCase() === cleanUsername ? updatedUser : u)));

    try {
      await fetch(apiUrl(`/api/users/${encodeURIComponent(cleanUsername)}/settings`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: mergedSettings,
          displayName: updatedUser.displayName,
          bio: updatedUser.bio,
          location: updatedUser.location,
        }),
      });
      return { success: true };
    } catch {
      return { success: true };
    }
  };

  // Change Password Action
  const changePasswordAction = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'User not authenticated' };
    const cleanUsername = currentUser.username.toLowerCase();

    try {
      const res = await fetch(apiUrl(`/api/users/${encodeURIComponent(cleanUsername)}/password`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || 'Failed to update password' };
      }

      const updatedUser: User = {
        ...currentUser,
        passwordHash: hashPassword(newPassword),
      };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => (u.username.toLowerCase() === cleanUsername ? updatedUser : u)));

      return { success: true };
    } catch {
      if (currentUser.passwordHash !== hashPassword(currentPassword)) {
        return { success: false, error: 'Current password is incorrect' };
      }
      const updatedUser: User = {
        ...currentUser,
        passwordHash: hashPassword(newPassword),
      };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => (u.username.toLowerCase() === cleanUsername ? updatedUser : u)));
      return { success: true };
    }
  };

  // Toggle favorite transfer
  const toggleFavoriteTransferAction = async (packageId: string): Promise<void> => {
    setTransfers(prev =>
      prev.map(t => (t.id === packageId ? { ...t, isFavorite: !t.isFavorite } : t))
    );

    if (currentUser) {
      const currentFavs = currentUser.favoritePackageIds || [];
      const isFavNow = currentFavs.includes(packageId);
      const nextFavs = isFavNow ? currentFavs.filter(id => id !== packageId) : [...currentFavs, packageId];
      const updatedUser = { ...currentUser, favoritePackageIds: nextFavs };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => (u.username.toLowerCase() === currentUser.username.toLowerCase() ? updatedUser : u)));

      try {
        await fetch(apiUrl(`/api/transfers/${encodeURIComponent(packageId)}/favorite`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: currentUser.username }),
        });
      } catch {}
    }
  };

  // Edit published package action
  const editPublishedPackageAction = async (id: string, updates: Partial<PublishedPackage>): Promise<{ success: boolean; error?: string }> => {
    setPublishedPackages(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );

    try {
      const res = await fetch(apiUrl(`/api/published/${encodeURIComponent(id)}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || 'Failed to update package' };
      }
      return { success: true };
    } catch {
      return { success: true };
    }
  };

  // Delete published package action
  const deletePublishedPackageAction = async (id: string): Promise<{ success: boolean; error?: string }> => {
    setPublishedPackages(prev => prev.filter(p => p.id !== id));
    try {
      const res = await fetch(apiUrl(`/api/published/${encodeURIComponent(id)}`), {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || 'Failed to delete package' };
      }
      return { success: true };
    } catch {
      return { success: true };
    }
  };

  // Report published package action
  const reportPackageAction = async (packageId: string, reason: string, details?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(apiUrl(`/api/published/${encodeURIComponent(packageId)}/report`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          details,
          reportedBy: currentUser?.username || 'anonymous',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || 'Failed to submit report' };
      }
      return { success: true };
    } catch {
      return { success: true };
    }
  };

  // Stubs for backward compat
  const [selectedPhotographer, setSelectedPhotographer] = useState<User | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [gridLayout, setGridLayout] = useState<any>('grid-3');
  const [selectedCategory, setSelectedCategory] = useState<any>('all');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [photos, setPhotos] = useState<Photo[]>(INITIAL_PHOTOS);

  return (
    <AppContext.Provider
      value={{
        users,
        currentUser,
        projects,
        photos,
        transfers,
        friendRequests,
        chatMessages,
        groups,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        selectedTheme,
        setThemeAction,
        theme: selectedTheme === 'graphite' ? 'dark' : 'dark', // Always comfortable dark charcoal
        toggleTheme: () => setThemeAction(selectedTheme === 'graphite' ? 'monochrome' : 'graphite'),
        seasonalEffectsEnabled,
        setSeasonalEffectsEnabled,
        isAvatarEditorOpen,
        setIsAvatarEditorOpen,
        updateCustomAvatarAction,
        updateUserSettingsAction,
        changePasswordAction,
        groupPrivacy,
        setGroupPrivacyAction,
        activeGroupId,
        setActiveGroupId,
        createGroupAction,
        renameGroupAction,
        deleteGroupAction,
        addMemberToGroupAction,
        removeMemberFromGroupAction,
        authModal,
        setAuthModal,
        signUp,
        signIn,
        signOut,
        switchUserQuick,
        searchAccountsGlobally,
        isRestoringSession,
        activeSessions,
        refreshSessionsAction,
        revokeSessionAction,
        signOutAllSessionsAction,
        isTransferModalOpen,
        setIsTransferModalOpen,
        sendTransfer,
        revokeTransfer,
        recordDownload,
        toggleFavoriteTransferAction,
        activeTransferPortalId,
        setActiveTransferPortalId,
        activeChatFriend,
        setActiveChatFriend,
        sendFriendRequestAction,
        acceptFriendRequestAction,
        declineFriendRequestAction,
        cancelFriendRequestAction,
        sendChatMessageAction,
        publishedPackages,
        publishPackageAction,
        editPublishedPackageAction,
        deletePublishedPackageAction,
        reportPackageAction,
        recordPublishedDownload,
        togglePublishedLikeAction,
        isPublishModalOpen,
        setIsPublishModalOpen,
        activeReportModalPackage,
        setActiveReportModalPackage,
        activePreviewMedia,
        setActivePreviewMedia,
        selectedPhotographer,
        setSelectedPhotographer,
        selectedProject,
        setSelectedProject,
        lightboxPhoto,
        setLightboxPhoto,
        gridLayout,
        setGridLayout,
        selectedCategory,
        setSelectedCategory,
        isAvatarModalOpen,
        setIsAvatarModalOpen,
        updateUserAvatar: async () => {},
        createProject: (d: any) => ({ ...d, id: `p-${Date.now()}` }),
        updateProject: () => {},
        deleteProject: () => {},
        addPhoto: (p: any) => ({ ...p, id: `ph-${Date.now()}` }),
        deletePhoto: () => {},
        updatePhoto: () => {},
        preselectedTransferProject: null,
        openTransferModalForProject: () => {},
        addTransferReview: () => {},
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
