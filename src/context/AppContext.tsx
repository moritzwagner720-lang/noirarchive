import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import {
  User,
  Project,
  Photo,
  FileTransferPackage,
  GridLayout,
  PhotoCategory,
  ClientReview,
  FriendRequest,
  ChatMessage,
  ChatAttachment,
  PublishedPackage,
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
import { validateUsername, validatePassword, hashPassword, verifyPassword } from '../utils/auth';
import { createTransferPackage, CreateTransferInput } from '../utils/transfer';
import { canSendFriendRequest, createFriendRequest, createChatMessage } from '../utils/friends';
import { createPublishedPackage, togglePackageLike, CreatePublishedInput } from '../utils/published';
import { apiUrl } from '../utils/api';

interface AppContextType {
  // Data
  users: User[];
  currentUser: User | null;
  projects: Project[];
  photos: Photo[];
  transfers: FileTransferPackage[];
  friendRequests: FriendRequest[];
  chatMessages: ChatMessage[];

  // Navigation & Views
  activeTab: 'explore' | 'published' | 'projects' | 'manage' | 'transfers' | 'friends';
  setActiveTab: (tab: 'explore' | 'published' | 'projects' | 'manage' | 'transfers' | 'friends') => void;
  selectedPhotographer: User | null;
  setSelectedPhotographer: (user: User | null) => void;
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  lightboxPhoto: Photo | null;
  setLightboxPhoto: (photo: Photo | null) => void;

  // Layout & Aesthetic
  gridLayout: GridLayout;
  setGridLayout: (layout: GridLayout) => void;
  selectedCategory: 'all' | PhotoCategory;
  setSelectedCategory: (cat: 'all' | PhotoCategory) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Auth Modals & Actions
  authModal: 'signin' | 'signup' | null;
  setAuthModal: (modal: 'signin' | 'signup' | null) => void;
  signUp: (data: {
    username: string;
    password: string;
    bio?: string;
    location?: string;
    avatar?: string;
  }) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  signIn: (username: string, password: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  signOut: () => void;
  switchUserQuick: (username: string) => void;
  searchAccountsGlobally: (query: string) => Promise<User[]>;

  // Avatar Management Modal
  isAvatarModalOpen: boolean;
  setIsAvatarModalOpen: (open: boolean) => void;
  updateUserAvatar: (avatar: string) => Promise<void> | void;

  // Project Management
  createProject: (data: {
    title: string;
    description: string;
    category: PhotoCategory;
    layoutPreference: GridLayout;
    coverPhotoUrl?: string;
    clientDeliveryNotes?: string;
    clientName?: string;
  }) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addPhoto: (photo: Omit<Photo, 'id' | 'createdAt' | 'userId'>) => Photo;
  deletePhoto: (id: string) => void;
  updatePhoto: (id: string, updates: Partial<Photo>) => void;

  // Transfers
  isTransferModalOpen: boolean;
  setIsTransferModalOpen: (open: boolean) => void;
  preselectedTransferProject: Project | null;
  openTransferModalForProject: (project: Project) => void;
  sendTransfer: (input: CreateTransferInput) => { success: boolean; packageId?: string; error?: string };
  revokeTransfer: (id: string) => void;
  recordDownload: (id: string) => void;
  addTransferReview: (id: string, review: Omit<ClientReview, 'id' | 'createdAt'>) => void;
  activeTransferPortalId: string | null;
  setActiveTransferPortalId: (id: string | null) => void;

  // Friends & Chat
  activeChatFriend: string | null;
  setActiveChatFriend: (username: string | null) => void;
  sendFriendRequestAction: (toUsername: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  acceptFriendRequestAction: (requestId: string) => void;
  declineFriendRequestAction: (requestId: string) => void;
  cancelFriendRequestAction: (requestId: string) => void;
  sendChatMessageAction: (recipientUsername: string, text: string, attachment?: ChatAttachment) => void;

  // Published Files & Public Downloads
  publishedPackages: PublishedPackage[];
  publishPackageAction: (input: CreatePublishedInput) => { success: boolean; package?: PublishedPackage; error?: string };
  recordPublishedDownload: (id: string) => void;
  togglePublishedLikeAction: (id: string) => void;
  isPublishModalOpen: boolean;
  setIsPublishModalOpen: (open: boolean) => void;
}


const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_USERS = 'noir_archive_users_v5';
const STORAGE_KEY_CURRENT_USER = 'noir_archive_current_user_v5';
const STORAGE_KEY_PROJECTS = 'noir_archive_projects_v5';
const STORAGE_KEY_PHOTOS = 'noir_archive_photos_v5';
const STORAGE_KEY_TRANSFERS = 'noir_archive_transfers_v5';
const STORAGE_KEY_THEME = 'noir_archive_theme_v5';
const STORAGE_KEY_FRIEND_REQUESTS = 'noir_archive_friend_requests_v5';
const STORAGE_KEY_CHAT_MESSAGES = 'noir_archive_chat_messages_v5';
const STORAGE_KEY_PUBLISHED = 'noir_archive_published_v5';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USERS);
      const parsed: User[] = stored ? JSON.parse(stored) : [];
      const userMap = new Map<string, User>();
      INITIAL_USERS.forEach(u => userMap.set(u.username.toLowerCase(), u));
      parsed.forEach(u => userMap.set(u.username.toLowerCase(), u));
      return Array.from(userMap.values());
    } catch {
      return INITIAL_USERS;
    }
  });

  // Persistent user session: Remains logged in across refreshes until explicit sign-out
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PROJECTS);
      return stored ? JSON.parse(stored) : INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  });

  const [photos, setPhotos] = useState<Photo[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PHOTOS);
      return stored ? JSON.parse(stored) : INITIAL_PHOTOS;
    } catch {
      return INITIAL_PHOTOS;
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

  // UI state
  const [activeTab, setActiveTab] = useState<'explore' | 'published' | 'projects' | 'manage' | 'transfers' | 'friends'>('explore');
  const [selectedPhotographer, setSelectedPhotographer] = useState<User | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [gridLayout, setGridLayout] = useState<GridLayout>('grid-3');
  const [selectedCategory, setSelectedCategory] = useState<'all' | PhotoCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [authModal, setAuthModal] = useState<'signin' | 'signup' | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [preselectedTransferProject, setPreselectedTransferProject] = useState<Project | null>(null);
  const [activeTransferPortalId, setActiveTransferPortalId] = useState<string | null>(null);
  const [activeChatFriend, setActiveChatFriend] = useState<string | null>('elena_k');

  const [publishedPackages, setPublishedPackages] = useState<PublishedPackage[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PUBLISHED);
      return stored ? JSON.parse(stored) : INITIAL_PUBLISHED_PACKAGES;
    } catch {
      return INITIAL_PUBLISHED_PACKAGES;
    }
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY_THEME) as 'dark' | 'light') || 'dark';
    } catch {
      return 'dark';
    }
  });

  // Apply theme to HTML and body immediately
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        if (theme === 'dark') {
          root.classList.add('dark');
          document.body.classList.add('dark');
          document.body.style.backgroundColor = '#090503';
          document.body.style.color = '#ffffff';
        } else {
          root.classList.remove('dark');
          document.body.classList.remove('dark');
          document.body.style.backgroundColor = '#fcf8f5';
          document.body.style.color = '#1c1917';
        }
      }
    } catch (e) {
      console.warn('Theme storage error', e);
    }
  }, [theme]);

  // Sync published packages
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PUBLISHED, JSON.stringify(publishedPackages));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [publishedPackages]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [users]);

  const currentUserRef = useRef<User | null>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Persist current logged-in user session so refresh does not log them out
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      }
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
      localStorage.setItem(STORAGE_KEY_PHOTOS, JSON.stringify(photos));
      localStorage.setItem(STORAGE_KEY_TRANSFERS, JSON.stringify(transfers));
      localStorage.setItem(STORAGE_KEY_FRIEND_REQUESTS, JSON.stringify(friendRequests));
      localStorage.setItem(STORAGE_KEY_CHAT_MESSAGES, JSON.stringify(chatMessages));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [projects, photos, transfers, friendRequests, chatMessages]);

  // Synchronize state with backend server via SSE & high-efficiency polling
  useEffect(() => {
    let isMounted = true;
    let es: EventSource | null = null;

    // Real-Time Server-Sent Events (SSE) Listener
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
          if (isMounted) {
            setFriendRequests(prev => prev.map(r => (r.id === id ? { ...r, status: 'declined' } : r)));
          }
        } catch {}
      });

      es.addEventListener('friend_request_cancelled', (e) => {
        try {
          const { id } = JSON.parse(e.data);
          if (isMounted) {
            setFriendRequests(prev => prev.filter(r => r.id !== id));
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

      es.addEventListener('transfer_reviewed', (e) => {
        try {
          const { id, review } = JSON.parse(e.data);
          if (isMounted) {
            setTransfers(prev => prev.map(t => (t.id === id ? { ...t, reviews: [review, ...(t.reviews || [])] } : t)));
          }
        } catch {}
      });

      es.addEventListener('new_published', (e) => {
        try {
          const pkg: PublishedPackage = JSON.parse(e.data);
          if (isMounted) {
            setPublishedPackages(prev => {
              const idx = prev.findIndex(p => p.id === pkg.id);
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

      es.addEventListener('published_liked', (e) => {
        try {
          const { id, likesCount, likedBy } = JSON.parse(e.data);
          if (isMounted) {
            setPublishedPackages(prev => prev.map(p => (p.id === id ? { ...p, likesCount, likedBy } : p)));
          }
        } catch {}
      });

      es.addEventListener('published_downloaded', (e) => {
        try {
          const { id, downloadsCount } = JSON.parse(e.data);
          if (isMounted) {
            setPublishedPackages(prev => prev.map(p => (p.id === id ? { ...p, downloadsCount } : p)));
          }
        } catch {}
      });

      es.addEventListener('user_registered', (e) => {
        try {
          const u: User = JSON.parse(e.data);
          if (isMounted) {
            setUsers(prev => (prev.some(item => item.username.toLowerCase() === u.username.toLowerCase()) ? prev : [...prev, u]));
          }
        } catch {}
      });

      es.addEventListener('user_updated', (e) => {
        try {
          const u: User = JSON.parse(e.data);
          if (isMounted) {
            setUsers(prev => prev.map(item => (item.username.toLowerCase() === u.username.toLowerCase() ? { ...item, ...u } : item)));
            if (currentUserRef.current?.username.toLowerCase() === u.username.toLowerCase()) {
              setCurrentUser(prev => (prev ? { ...prev, ...u } : null));
            }
          }
        } catch {}
      });
    } catch {}

    const syncWithServer = async () => {
      try {
        // 1. Sync users
        const usersRes = await fetch(apiUrl('/api/users'));
        if (usersRes.ok) {
          const serverUsers: User[] = await usersRes.json();
          if (isMounted && Array.isArray(serverUsers) && serverUsers.length > 0) {
            setUsers(prev => {
              const map = new Map<string, User>();
              INITIAL_USERS.forEach(u => map.set(u.username.toLowerCase(), u));
              prev.forEach(u => map.set(u.username.toLowerCase(), u));
              serverUsers.forEach(u => {
                const existing = map.get(u.username.toLowerCase());
                map.set(u.username.toLowerCase(), {
                  ...u,
                  passwordHash: existing?.passwordHash || hashPassword('password123'),
                  friends: Array.from(new Set([...(existing?.friends || []), ...(u.friends || [])])),
                });
              });
              return Array.from(map.values());
            });

            // Keep currentUser in sync with fresh friends list & profile from server
            const me = currentUserRef.current;
            if (me) {
              const freshMe = serverUsers.find(u => u.username.toLowerCase() === me.username.toLowerCase());
              if (freshMe) {
                setCurrentUser(prev => {
                  if (!prev) return null;
                  const prevFriends = prev.friends || [];
                  const newFriends = freshMe.friends || [];
                  const isDiff =
                    prevFriends.length !== newFriends.length ||
                    prevFriends.some((f, idx) => f !== newFriends[idx]) ||
                    prev.bio !== freshMe.bio ||
                    prev.avatar !== freshMe.avatar;
                  return isDiff ? { ...prev, ...freshMe, friends: newFriends } : prev;
                });
              }
            }
          }
        }

        // 2. Sync friend requests
        const reqRes = await fetch(apiUrl('/api/friend-requests'));
        if (reqRes.ok) {
          const serverRequests = await reqRes.json();
          if (isMounted && Array.isArray(serverRequests)) {
            setFriendRequests(serverRequests);
          }
        }

        // 3. Sync chat messages
        const chatRes = await fetch(apiUrl('/api/chat-messages'));
        if (chatRes.ok) {
          const serverMessages: ChatMessage[] = await chatRes.json();
          if (isMounted && Array.isArray(serverMessages)) {
            setChatMessages(prev => {
              const map = new Map<string, ChatMessage>();
              serverMessages.forEach(m => map.set(m.id, m));
              const now = Date.now();
              prev.forEach(m => {
                if (!map.has(m.id)) {
                  const age = now - new Date(m.createdAt).getTime();
                  if (age < 15000) {
                    map.set(m.id, m);
                  }
                }
              });
              return Array.from(map.values()).sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              );
            });
          }
        }

        // 4. Sync transfers from backend
        const transferRes = await fetch(apiUrl('/api/transfers'));
        if (transferRes.ok) {
          const serverTransfers: FileTransferPackage[] = await transferRes.json();
          if (isMounted && Array.isArray(serverTransfers)) {
            setTransfers(prev => {
              const map = new Map<string, FileTransferPackage>();
              serverTransfers.forEach(t => map.set(t.id, t));
              prev.forEach(t => {
                if (!map.has(t.id)) map.set(t.id, t);
              });
              return Array.from(map.values()).sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
            });
          }
        }

        // 5. Sync published community packages from backend
        const pubRes = await fetch(apiUrl('/api/published'));
        if (pubRes.ok) {
          const serverPub: PublishedPackage[] = await pubRes.json();
          if (isMounted && Array.isArray(serverPub)) {
            setPublishedPackages(prev => {
              const map = new Map<string, PublishedPackage>();
              serverPub.forEach(p => map.set(p.id, p));
              prev.forEach(p => {
                if (!map.has(p.id)) map.set(p.id, p);
              });
              return Array.from(map.values()).sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
            });
          }
        }
      } catch {
        // Offline or fallback mode
      }
    };

    syncWithServer();
    const interval = setInterval(syncWithServer, 2000);
    window.addEventListener('focus', syncWithServer);

    return () => {
      isMounted = false;
      if (es) {
        es.close();
      }
      clearInterval(interval);
      window.removeEventListener('focus', syncWithServer);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const transferParam = params.get('transfer');
    if (transferParam) {
      setActiveTransferPortalId(transferParam);
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // User Avatar update (persisted to server & locally)
  const updateUserAvatar = async (newAvatar: string) => {
    if (!currentUser) return;
    setCurrentUser(prev => (prev ? { ...prev, avatar: newAvatar } : null));
    setUsers(prev =>
      prev.map(u => (u.username.toLowerCase() === currentUser.username.toLowerCase() ? { ...u, avatar: newAvatar } : u))
    );
    try {
      await fetch(apiUrl(`/api/users/${encodeURIComponent(currentUser.username)}/avatar`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: newAvatar }),
      });
    } catch {}
  };

  // Global search for user accounts across the platform
  const searchAccountsGlobally = async (query: string): Promise<User[]> => {
    const clean = query.trim().toLowerCase();
    const excludeParam = currentUser ? `&exclude=${encodeURIComponent(currentUser.username)}` : '';
    try {
      let remoteUsers: User[] | null = null;
      // 1. Try search with query parameters
      const res1 = await fetch(apiUrl(`/api/users/search?q=${encodeURIComponent(clean)}${excludeParam}`));
      if (res1.ok) {
        remoteUsers = await res1.json();
      } else {
        // 2. Fallback to path parameter format
        const res2 = await fetch(apiUrl(`/api/users/search/${encodeURIComponent(clean || 'all')}`));
        if (res2.ok) {
          remoteUsers = await res2.json();
        }
      }

      if (Array.isArray(remoteUsers)) {
        // Cache newly discovered users
        setUsers(prev => {
          const map = new Map<string, User>();
          prev.forEach(u => map.set(u.username.toLowerCase(), u));
          remoteUsers!.forEach(u => {
            const ex = map.get(u.username.toLowerCase());
            map.set(u.username.toLowerCase(), {
              ...u,
              passwordHash: ex?.passwordHash || hashPassword('password123'),
              friends: Array.from(new Set([...(ex?.friends || []), ...(u.friends || [])])),
            });
          });
          return Array.from(map.values());
        });

        // Always exclude the current user from search results
        const filtered = currentUser
          ? remoteUsers.filter(u => u.username.toLowerCase() !== currentUser.username.toLowerCase())
          : remoteUsers;
        return filtered;
      }
    } catch (err) {
      console.warn('[Noir Archive] Account search network error:', err);
    }

    return users.filter(
      u =>
        (!currentUser || u.username.toLowerCase() !== currentUser.username.toLowerCase()) &&
        (u.username.toLowerCase().includes(clean) || (u.bio && u.bio.toLowerCase().includes(clean)))
    );
  };

  // Auth operations (purely username and password, strictly persisted to Supabase)
  const signUp = async (data: {
    username: string;
    password: string;
    bio?: string;
    location?: string;
    avatar?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const userVal = validateUsername(data.username, users);
    if (!userVal.isValid) {
      return { success: false, error: userVal.error };
    }

    const passVal = validatePassword(data.password);
    if (!passVal.isValid) {
      return { success: false, error: passVal.feedback };
    }

    const cleanUsername = data.username.trim().toLowerCase();

    // Persist directly to production cloud server
    try {
      const res = await fetch(apiUrl('/api/auth/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          password: data.password,
          bio: data.bio?.trim() || 'Visual artist and photographer.',
          avatar: data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          location: data.location?.trim() || 'Worldwide',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || `Registration failed (HTTP ${res.status})` };
      }

      const resData = await res.json();
      if (!resData.user) {
        return { success: false, error: 'Malformed server response' };
      }

      const authenticatedUser: User = {
        ...resData.user,
        passwordHash: hashPassword(data.password),
        friends: resData.user.friends || [],
      };

      setUsers(prev => [...prev.filter(u => u.username.toLowerCase() !== cleanUsername), authenticatedUser]);
      setCurrentUser(authenticatedUser);
      setAuthModal(null);

      return { success: true };
    } catch (err: any) {
      console.error('[Noir Archive] Signup error:', err);
      return {
        success: false,
        error: 'Cannot connect to Noir Archive cloud service (https://noirarchive.onrender.com). Please check your internet connection.',
      };
    }
  };

  const signIn = async (username: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const normalized = username.trim().toLowerCase();

    // Authenticate strictly with the production cloud server
    try {
      const res = await fetch(apiUrl('/api/auth/signin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: normalized, password: pass }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const authenticatedUser: User = {
            ...data.user,
            passwordHash: hashPassword(pass),
            friends: data.user.friends || [],
          };
          setUsers(prev => {
            const map = new Map<string, User>();
            prev.forEach(u => map.set(u.username.toLowerCase(), u));
            map.set(authenticatedUser.username.toLowerCase(), authenticatedUser);
            return Array.from(map.values());
          });
          setCurrentUser(authenticatedUser);
          setAuthModal(null);
          return { success: true };
        }
      }

      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || 'Invalid username or password' };
    } catch (err: any) {
      console.error('[Noir Archive] SignIn error:', err);
      return {
        success: false,
        error: 'Cannot connect to Noir Archive cloud service (https://noirarchive.onrender.com). Please check your internet connection.',
      };
    }
  };

  const signOut = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      sessionStorage.clear();
    } catch {}
  };

  const switchUserQuick = (username: string) => {
    const target = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (target) {
      setCurrentUser(target);
    }
  };

  // Project Management
  const createProject = (data: {
    title: string;
    description: string;
    category: PhotoCategory;
    layoutPreference: GridLayout;
    coverPhotoUrl?: string;
    clientDeliveryNotes?: string;
    clientName?: string;
  }) => {
    if (!currentUser) throw new Error('Must be signed in to create projects');

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      userId: currentUser.id,
      title: data.title.trim(),
      description: data.description.trim(),
      coverPhotoUrl:
        data.coverPhotoUrl ||
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=85',
      layoutPreference: data.layoutPreference || 'grid-3',
      isPublic: true,
      category: data.category,
      createdAt: new Date().toISOString(),
      clientDeliveryNotes: data.clientDeliveryNotes?.trim() || undefined,
      clientName: data.clientName?.trim() || undefined,
    };

    setProjects(prev => [newProject, ...prev]);
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    if (selectedProject?.id === id) {
      setSelectedProject(prev => (prev ? { ...prev, ...updates } : null));
    }
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setPhotos(prev => prev.filter(ph => ph.projectId !== id));
    if (selectedProject?.id === id) {
      setSelectedProject(null);
    }
  };

  const addPhoto = (photoData: Omit<Photo, 'id' | 'createdAt' | 'userId'>) => {
    if (!currentUser) throw new Error('Must be signed in to add photos');

    const newPhoto: Photo = {
      ...photoData,
      id: `ph-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: currentUser.id,
      createdAt: new Date().toISOString(),
    };

    setPhotos(prev => [newPhoto, ...prev]);

    const proj = projects.find(p => p.id === photoData.projectId);
    if (proj && !proj.coverPhotoUrl) {
      updateProject(proj.id, { coverPhotoUrl: newPhoto.url });
    }

    return newPhoto;
  };

  const deletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
    if (lightboxPhoto?.id === id) {
      setLightboxPhoto(null);
    }
  };

  const updatePhoto = (id: string, updates: Partial<Photo>) => {
    setPhotos(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    if (lightboxPhoto?.id === id) {
      setLightboxPhoto(prev => (prev ? { ...prev, ...updates } : null));
    }
  };

  // Transfers
  const openTransferModalForProject = (project: Project) => {
    setPreselectedTransferProject(project);
    setIsTransferModalOpen(true);
  };

  const sendTransfer = (input: CreateTransferInput) => {
    try {
      const pkg = createTransferPackage(input);
      setTransfers(prev => [pkg, ...prev]);
      setPreselectedTransferProject(null);

      // Persist to server for global client delivery
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
    setTransfers(prev =>
      prev.map(t => (t.id === id ? { ...t, status: 'revoked' } : t))
    );
    try {
      fetch(apiUrl(`/api/transfers/${encodeURIComponent(id)}/revoke`), { method: 'POST' }).catch(() => {});
    } catch {}
  };

  const recordDownload = (id: string) => {
    setTransfers(prev =>
      prev.map(t => (t.id === id ? { ...t, downloadsCount: t.downloadsCount + 1 } : t))
    );
    try {
      fetch(apiUrl(`/api/transfers/${encodeURIComponent(id)}/download`), { method: 'POST' }).catch(() => {});
    } catch {}
  };

  const addTransferReview = (id: string, review: Omit<ClientReview, 'id' | 'createdAt'>) => {
    const newRev: ClientReview = {
      ...review,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTransfers(prev =>
      prev.map(t =>
        t.id === id ? { ...t, reviews: [newRev, ...(t.reviews || [])] } : t
      )
    );
    try {
      fetch(apiUrl(`/api/transfers/${encodeURIComponent(id)}/review`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review),
      }).catch(() => {});
    } catch {}
  };

  // Friends & Chat operations
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

    // Check if target user exists in local state or INITIAL_USERS
    let targetUser = users.find(u => u.username.toLowerCase() === cleanTo);
    if (!targetUser) {
      targetUser = INITIAL_USERS.find(u => u.username.toLowerCase() === cleanTo);
      if (targetUser) {
        setUsers(prev => [...prev, targetUser!]);
      }
    }

    // If still not found, query backend server to see if user was recently registered
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

    // STRICT CHECK: User MUST exist to send a friend request!
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

    // Send strictly to production backend server
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
    } catch (err: any) {
      console.error('[Noir Archive] Send friend request error:', err);
      return {
        success: false,
        error: 'Cloud sync error: Unable to reach Noir Archive cloud server (https://noirarchive.onrender.com). Please check your connection.',
      };
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

    setFriendRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status: 'accepted' } : r))
    );

    const friendName = req.fromUsername.toLowerCase() === currentUser.username.toLowerCase()
      ? req.toUsername
      : req.fromUsername;

    setUsers(prev =>
      prev.map(u => {
        if (u.username.toLowerCase() === currentUser.username.toLowerCase()) {
          const updated = Array.from(new Set([...(u.friends || []), friendName]));
          return { ...u, friends: updated };
        }
        if (u.username.toLowerCase() === friendName.toLowerCase()) {
          const updated = Array.from(new Set([...(u.friends || []), currentUser.username]));
          return { ...u, friends: updated };
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

    setFriendRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status: 'declined' } : r))
    );
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
    const username = currentUser?.username || 'anonymous_admirer';
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
        activeTab,
        setActiveTab,
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
        theme,
        toggleTheme,
        searchQuery,
        setSearchQuery,
        authModal,
        setAuthModal,
        signUp,
        signIn,
        signOut,
        switchUserQuick,
        searchAccountsGlobally,
        isAvatarModalOpen,
        setIsAvatarModalOpen,
        updateUserAvatar,
        createProject,
        updateProject,
        deleteProject,
        addPhoto,
        deletePhoto,
        updatePhoto,
        isTransferModalOpen,
        setIsTransferModalOpen,
        preselectedTransferProject,
        openTransferModalForProject,
        sendTransfer,
        revokeTransfer,
        recordDownload,
        addTransferReview,
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
        recordPublishedDownload,
        togglePublishedLikeAction,
        isPublishModalOpen,
        setIsPublishModalOpen,
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
