import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  isSupabaseConfigured,
  testSupabaseConnection,
  getSupabaseUsers,
  getSupabaseUserByUsername,
  searchSupabaseUsers,
  createSupabaseUser,
  updateSupabaseUserAvatar,
  updateSupabaseUserFriends,
  getSupabaseFriendRequests,
  createSupabaseFriendRequest,
  updateSupabaseFriendRequestStatus,
  deleteSupabaseFriendRequest,
  getSupabaseChatMessages,
  createSupabaseChatMessage,
  getSupabaseTransfers,
  upsertSupabaseTransfer,
  incrementSupabaseTransferDownload,
  revokeSupabaseTransfer,
  addSupabaseTransferReview,
  getSupabasePublished,
  upsertSupabasePublished,
  updateSupabasePublishedLike,
  incrementSupabasePublishedDownload,
  syncLocalStorageToSupabase,
  SUPABASE_PROJECT_REF,
  DEFAULT_SUPABASE_URL,
  UserDTO,
} from './src/server/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.resolve(__dirname, 'server-storage.json');

// Simple hash matching client-side hashPassword
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash_${Math.abs(hash).toString(16)}_${password.length}`;
}

export interface User {
  id: string;
  username: string;
  bio?: string;
  avatar: string;
  location?: string;
  passwordHash: string;
  createdAt: string;
  friends: string[];
}

interface StoreData {
  users: User[];
  friendRequests: any[];
  chatMessages: any[];
  transfers: any[];
  publishedPackages: any[];
}

const DEFAULT_USERS: User[] = [
  {
    id: 'user-moritz',
    username: 'moritz',
    bio: 'Architectural and minimalist street photography. Exploring geometric tension, concrete textures, and natural contrast.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    location: 'Berlin',
    passwordHash: hashPassword('password123'),
    createdAt: '2024-01-15T10:00:00.000Z',
    friends: ['elena_k', 'kenji_mono'],
  },
  {
    id: 'user-elena',
    username: 'elena_k',
    bio: 'Monochrome portraiture, sculptural fashion, and darkroom chiaroscuro.',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    location: 'Paris',
    passwordHash: hashPassword('secret456'),
    createdAt: '2024-02-01T12:00:00.000Z',
    friends: ['moritz'],
  },
  {
    id: 'user-kenji',
    username: 'kenji_mono',
    bio: 'Nocturnal street observer. Capturing midnight rain, subway shadows, and solitary moments across Tokyo.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    location: 'Tokyo',
    passwordHash: hashPassword('mono789'),
    createdAt: '2024-03-10T09:30:00.000Z',
    friends: ['moritz'],
  },
  {
    id: 'user-daddy',
    username: 'daddy',
    bio: 'Visual artist and photographer.',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    location: 'Berlin',
    passwordHash: hashPassword('password123'),
    createdAt: '2024-04-01T09:30:00.000Z',
    friends: [],
  },
];

function loadStore(): StoreData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      const userMap = new Map<string, User>();
      DEFAULT_USERS.forEach(u => userMap.set(u.username.toLowerCase(), u));
      (data.users || []).forEach((u: User) => userMap.set(u.username.toLowerCase(), u));
      data.users = Array.from(userMap.values());
      return data;
    }
  } catch (err) {
    console.error('Error reading store file:', err);
  }

  const initialStore: StoreData = {
    users: [...DEFAULT_USERS],
    friendRequests: [],
    chatMessages: [],
    transfers: [],
    publishedPackages: [],
  };
  saveStore(initialStore);
  return initialStore;
}

function saveStore(data: StoreData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving store file:', err);
  }
}

// In-memory store initialized from disk as resilient baseline
let store = loadStore();

function sanitizeUser(user: User | UserDTO) {
  const { passwordHash, ...safe } = user;
  return safe;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Verify and initialize Supabase persistence
  let supabaseStatus: { connected: boolean; message?: string } = { connected: false, message: 'Not initialized' };
  if (isSupabaseConfigured()) {
    supabaseStatus = await testSupabaseConnection();
    if (supabaseStatus.connected) {
      console.log(`[Noir Archive] Supabase connected to project: ${SUPABASE_PROJECT_REF}`);
      // Preserve existing data without overwriting
      await syncLocalStorageToSupabase(store);
      // Refresh local cache with live Supabase users
      const liveUsers = await getSupabaseUsers();
      if (liveUsers.length > 0) {
        store.users = liveUsers;
      }
    } else {
      console.warn(`[Noir Archive] Supabase connection check warning: ${supabaseStatus.message}`);
    }
  } else {
    console.log(
      `[Noir Archive] Supabase Project: ${SUPABASE_PROJECT_REF} (${DEFAULT_SUPABASE_URL}). Local disk fallback active until SUPABASE_SERVICE_ROLE_KEY is set in .env.`
    );
  }

  // CORS Middleware for universal cross-origin, mobile, and electron desktop support
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json({ limit: '50mb' }));

  // SSE Clients Registry for real-time live synchronization
  const sseClients = new Set<express.Response>();

  function broadcast(type: string, data: any) {
    const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(payload);
      } catch {
        sseClients.delete(client);
      }
    }
  }

  // Real-time Event Stream (SSE)
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    res.write(`event: connected\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`);
    sseClients.add(res);

    const heartbeat = setInterval(() => {
      try {
        res.write(`: ping\n\n`);
      } catch {
        clearInterval(heartbeat);
        sseClients.delete(res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  // Diagnostics and Health Check (reporting Supabase connection status)
  app.get('/api/health', async (_req, res) => {
    const currentStatus = isSupabaseConfigured() ? await testSupabaseConnection() : { connected: false, message: 'SUPABASE_SERVICE_ROLE_KEY not set' };
    res.json({
      status: 'ok',
      version: '1.28',
      database: isSupabaseConfigured() && currentStatus.connected ? 'supabase_postgres' : 'local_storage_fallback',
      supabaseProjectRef: SUPABASE_PROJECT_REF,
      supabaseUrl: DEFAULT_SUPABASE_URL,
      supabaseConnected: currentStatus.connected,
      supabaseMessage: currentStatus.message,
      usersCount: store.users.length,
      transfersCount: store.transfers.length,
      timestamp: new Date().toISOString(),
    });
  });

  // --- API ROUTES ---

  // Get all users (public profiles, passwords omitted)
  app.get('/api/users', async (_req, res) => {
    if (isSupabaseConfigured()) {
      const users = await getSupabaseUsers();
      if (users.length > 0) {
        store.users = users;
        return res.json(users.map(sanitizeUser));
      }
    }
    res.json(store.users.map(sanitizeUser));
  });

  // Global search for user accounts by username handle, bio or location
  app.get('/api/users/search/:query', async (req, res) => {
    const query = req.params.query.toLowerCase().trim();
    if (isSupabaseConfigured()) {
      const matches = await searchSupabaseUsers(query);
      return res.json(matches.map(sanitizeUser));
    }

    if (!query) {
      return res.json(store.users.map(sanitizeUser));
    }
    const matches = store.users
      .filter(
        u =>
          u.username.toLowerCase().includes(query) ||
          (u.bio && u.bio.toLowerCase().includes(query)) ||
          (u.location && u.location.toLowerCase().includes(query))
      )
      .map(sanitizeUser);
    res.json(matches);
  });

  // Get single user by username
  app.get('/api/users/:username', async (req, res) => {
    const username = req.params.username.replace(/^@/, '').toLowerCase().trim();
    if (isSupabaseConfigured()) {
      const user = await getSupabaseUserByUsername(username);
      if (user) {
        return res.json(sanitizeUser(user));
      }
    }

    const user = store.users.find(u => u.username.toLowerCase() === username);
    if (!user) {
      return res.status(404).json({ error: `User @${req.params.username} not found` });
    }
    res.json(sanitizeUser(user));
  });

  // Update user avatar
  app.post('/api/users/:username/avatar', async (req, res) => {
    const username = req.params.username.replace(/^@/, '').toLowerCase().trim();
    const { avatar } = req.body;
    if (!avatar) {
      return res.status(400).json({ error: 'Avatar data is required' });
    }

    if (isSupabaseConfigured()) {
      const updated = await updateSupabaseUserAvatar(username, avatar);
      if (updated) {
        const idx = store.users.findIndex(u => u.username.toLowerCase() === username);
        if (idx >= 0) store.users[idx] = updated;
        saveStore(store);
        broadcast('user_updated', sanitizeUser(updated));
        return res.json({ success: true, user: sanitizeUser(updated) });
      }
    }

    const user = store.users.find(u => u.username.toLowerCase() === username);
    if (!user) {
      return res.status(404).json({ error: `User @${req.params.username} not found` });
    }
    user.avatar = avatar;
    saveStore(store);
    broadcast('user_updated', sanitizeUser(user));
    res.json({ success: true, user: sanitizeUser(user) });
  });

  // User Sign Up
  app.post('/api/auth/signup', async (req, res) => {
    const { username, password, bio, avatar, location } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.replace(/^@/, '').trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (isSupabaseConfigured()) {
      const existingInDb = await getSupabaseUserByUsername(cleanUsername);
      if (existingInDb) {
        return res.status(400).json({ error: `The username "${cleanUsername}" is already taken` });
      }
    }

    const existingLocal = store.users.find(u => u.username.toLowerCase() === cleanUsername);
    if (existingLocal) {
      return res.status(400).json({ error: `The username "${cleanUsername}" is already taken` });
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      bio: bio?.trim() || 'Visual artist and photographer.',
      avatar:
        avatar?.trim() ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      location: location?.trim() || 'Worldwide',
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
      friends: [],
    };

    if (isSupabaseConfigured()) {
      try {
        await createSupabaseUser(newUser);
      } catch (err: any) {
        console.error('[Supabase Signup Error]:', err.message);
      }
    }

    store.users.push(newUser);
    saveStore(store);

    broadcast('user_registered', sanitizeUser(newUser));
    res.json({ success: true, user: sanitizeUser(newUser) });
  });

  // User Sign In
  app.post('/api/auth/signin', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.replace(/^@/, '').trim().toLowerCase();

    let user: User | UserDTO | null = null;
    if (isSupabaseConfigured()) {
      user = await getSupabaseUserByUsername(cleanUsername);
    }
    if (!user) {
      user = store.users.find(u => u.username.toLowerCase() === cleanUsername) || null;
    }

    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json({ success: true, user: sanitizeUser(user) });
  });

  // Client Sync Local User
  app.post('/api/users/sync', async (req, res) => {
    const { user } = req.body;
    if (!user || !user.username) {
      return res.status(400).json({ error: 'User data required' });
    }

    const clean = user.username.replace(/^@/, '').trim().toLowerCase();
    let existing: User | UserDTO | null = null;

    if (isSupabaseConfigured()) {
      existing = await getSupabaseUserByUsername(clean);
    }
    if (!existing) {
      existing = store.users.find(u => u.username.toLowerCase() === clean) || null;
    }

    if (!existing) {
      const added: User = {
        id: user.id || `user-${Date.now()}`,
        username: clean,
        bio: user.bio || '',
        avatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        location: user.location || '',
        passwordHash: user.passwordHash || hashPassword('password123'),
        createdAt: user.createdAt || new Date().toISOString(),
        friends: user.friends || [],
      };

      if (isSupabaseConfigured()) {
        await createSupabaseUser(added).catch(() => {});
      }

      store.users.push(added);
      saveStore(store);
      broadcast('user_registered', sanitizeUser(added));
    }

    res.json({ success: true, users: store.users.map(sanitizeUser) });
  });

  // Friend Requests - Get
  app.get('/api/friend-requests', async (req, res) => {
    const user = req.query.user as string;
    if (isSupabaseConfigured()) {
      const requests = await getSupabaseFriendRequests(user);
      if (requests.length > 0 || user) {
        return res.json(requests);
      }
    }

    if (user) {
      const clean = user.replace(/^@/, '').toLowerCase();
      const filtered = store.friendRequests.filter(
        r => r.fromUsername.toLowerCase() === clean || r.toUsername.toLowerCase() === clean
      );
      return res.json(filtered);
    }
    res.json(store.friendRequests);
  });

  // Friend Requests - Send
  app.post('/api/friend-requests', async (req, res) => {
    const { fromUsername, toUsername } = req.body;
    if (!fromUsername || !toUsername) {
      return res.status(400).json({ error: 'Sender and recipient handles are required' });
    }

    const from = fromUsername.replace(/^@/, '').trim().toLowerCase();
    const to = toUsername.replace(/^@/, '').trim().toLowerCase();

    if (from === to) {
      return res.status(400).json({ error: 'You cannot send a friend request to yourself.' });
    }

    let targetUser: User | UserDTO | null = null;
    let senderUser: User | UserDTO | null = null;

    if (isSupabaseConfigured()) {
      targetUser = await getSupabaseUserByUsername(to);
      senderUser = await getSupabaseUserByUsername(from);
    }
    if (!targetUser) {
      targetUser = store.users.find(u => u.username.toLowerCase() === to) || null;
    }
    if (!senderUser) {
      senderUser = store.users.find(u => u.username.toLowerCase() === from) || null;
    }

    if (!targetUser) {
      return res.status(404).json({ error: `User @${to} does not exist.` });
    }

    if (senderUser && senderUser.friends?.map((f: string) => f.toLowerCase()).includes(to)) {
      return res.status(400).json({ error: `@${to} is already in your friends list.` });
    }

    const existingPending = store.friendRequests.find(
      r =>
        r.status === 'pending' &&
        ((r.fromUsername.toLowerCase() === from && r.toUsername.toLowerCase() === to) ||
          (r.fromUsername.toLowerCase() === to && r.toUsername.toLowerCase() === from))
    );

    if (existingPending) {
      return res.status(400).json({ error: `A friend request between @${from} and @${to} is already pending.` });
    }

    const newRequest = {
      id: `freq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fromUsername: from,
      toUsername: to,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      await createSupabaseFriendRequest(newRequest).catch(() => {});
    }

    store.friendRequests.unshift(newRequest);
    saveStore(store);

    broadcast('friend_request_created', newRequest);
    res.json({ success: true, request: newRequest });
  });

  // Friend Requests - Accept
  app.post('/api/friend-requests/:id/accept', async (req, res) => {
    const { id } = req.params;
    const request = store.friendRequests.find(r => r.id === id);
    if (!request) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    request.status = 'accepted';

    const u1 = store.users.find(u => u.username.toLowerCase() === request.fromUsername.toLowerCase());
    const u2 = store.users.find(u => u.username.toLowerCase() === request.toUsername.toLowerCase());

    if (u1) {
      u1.friends = Array.from(new Set([...(u1.friends || []), request.toUsername]));
    }
    if (u2) {
      u2.friends = Array.from(new Set([...(u2.friends || []), request.fromUsername]));
    }

    if (isSupabaseConfigured()) {
      await updateSupabaseFriendRequestStatus(id, 'accepted');
      if (u1) await updateSupabaseUserFriends(u1.username, u1.friends);
      if (u2) await updateSupabaseUserFriends(u2.username, u2.friends);
    }

    saveStore(store);
    broadcast('friend_request_accepted', { id, request, users: store.users.map(sanitizeUser) });
    res.json({ success: true, users: store.users.map(sanitizeUser) });
  });

  // Friend Requests - Decline
  app.post('/api/friend-requests/:id/decline', async (req, res) => {
    const { id } = req.params;
    const request = store.friendRequests.find(r => r.id === id);
    if (!request) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    request.status = 'declined';
    if (isSupabaseConfigured()) {
      await updateSupabaseFriendRequestStatus(id, 'declined');
    }
    saveStore(store);
    broadcast('friend_request_declined', { id });
    res.json({ success: true });
  });

  // Friend Requests - Cancel
  app.post('/api/friend-requests/:id/cancel', async (req, res) => {
    const { id } = req.params;
    store.friendRequests = store.friendRequests.filter(r => r.id !== id);
    if (isSupabaseConfigured()) {
      await deleteSupabaseFriendRequest(id);
    }
    saveStore(store);
    broadcast('friend_request_cancelled', { id });
    res.json({ success: true });
  });

  // Chat Messages - Get
  app.get('/api/chat-messages', async (req, res) => {
    const { user1, user2 } = req.query as { user1?: string; user2?: string };
    if (isSupabaseConfigured()) {
      const messages = await getSupabaseChatMessages(user1, user2);
      if (messages.length > 0 || (user1 && user2)) {
        return res.json(messages);
      }
    }

    if (user1 && user2) {
      const u1 = user1.replace(/^@/, '').toLowerCase();
      const u2 = user2.replace(/^@/, '').toLowerCase();
      const messages = store.chatMessages.filter(
        m =>
          (m.senderUsername.toLowerCase() === u1 && m.recipientUsername.toLowerCase() === u2) ||
          (m.senderUsername.toLowerCase() === u2 && m.recipientUsername.toLowerCase() === u1)
      );
      return res.json(messages);
    }
    res.json(store.chatMessages);
  });

  // Chat Messages - Send
  app.post('/api/chat-messages', async (req, res) => {
    const { id, senderUsername, recipientUsername, text, attachment } = req.body;
    if (!senderUsername || !recipientUsername || (!text?.trim() && !attachment)) {
      return res.status(400).json({ error: 'Invalid message parameters' });
    }

    const cleanSender = senderUsername.replace(/^@/, '').toLowerCase().trim();
    const cleanRecipient = recipientUsername.replace(/^@/, '').toLowerCase().trim();

    const msgId = id || `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const existing = store.chatMessages.find(m => m.id === msgId);
    if (existing) {
      return res.json({ success: true, message: existing });
    }

    const newMessage = {
      id: msgId,
      senderUsername: cleanSender,
      recipientUsername: cleanRecipient,
      text: text?.trim() || '',
      attachment,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      await createSupabaseChatMessage(newMessage).catch(() => {});
    }

    store.chatMessages.push(newMessage);
    saveStore(store);

    broadcast('new_message', newMessage);
    res.json({ success: true, message: newMessage });
  });

  // Transfers - Get All
  app.get('/api/transfers', async (_req, res) => {
    if (isSupabaseConfigured()) {
      const dbTransfers = await getSupabaseTransfers();
      if (dbTransfers.length > 0) {
        return res.json(dbTransfers);
      }
    }
    res.json(store.transfers);
  });

  // Transfers - Create
  app.post('/api/transfers', async (req, res) => {
    const transfer = req.body;
    if (!transfer || !transfer.id) {
      return res.status(400).json({ error: 'Invalid transfer payload' });
    }

    if (isSupabaseConfigured()) {
      await upsertSupabaseTransfer(transfer).catch(() => {});
    }

    const idx = store.transfers.findIndex(t => t.id === transfer.id);
    if (idx >= 0) {
      store.transfers[idx] = transfer;
    } else {
      store.transfers.unshift(transfer);
    }
    saveStore(store);
    broadcast('new_transfer', transfer);
    res.json({ success: true, transfer });
  });

  // Transfers - Download Counter
  app.post('/api/transfers/:id/download', async (req, res) => {
    const { id } = req.params;
    let downloadsCount = 1;

    if (isSupabaseConfigured()) {
      downloadsCount = await incrementSupabaseTransferDownload(id);
    }

    const t = store.transfers.find(item => item.id === id);
    if (t) {
      t.downloadsCount = downloadsCount;
      saveStore(store);
    }
    broadcast('transfer_downloaded', { id, downloadsCount });
    res.json({ success: true, downloadsCount });
  });

  // Transfers - Revoke Access
  app.post('/api/transfers/:id/revoke', async (req, res) => {
    const { id } = req.params;
    if (isSupabaseConfigured()) {
      await revokeSupabaseTransfer(id);
    }
    const t = store.transfers.find(item => item.id === id);
    if (t) {
      t.status = 'revoked';
      saveStore(store);
    }
    broadcast('transfer_revoked', { id });
    res.json({ success: true });
  });

  // Transfers - Add Client Review
  app.post('/api/transfers/:id/review', async (req, res) => {
    const { id } = req.params;
    const { author, rating, comment } = req.body;
    const newRev = {
      id: `rev-${Date.now()}`,
      author: author || 'Client',
      rating: Number(rating) || 5,
      comment: comment || '',
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      await addSupabaseTransferReview(id, newRev);
    }

    const t = store.transfers.find(item => item.id === id);
    if (t) {
      t.reviews = [newRev, ...(t.reviews || [])];
      saveStore(store);
    }

    broadcast('transfer_reviewed', { id, review: newRev });
    res.json({ success: true, review: newRev });
  });

  // Published Packages - Get All
  app.get('/api/published', async (_req, res) => {
    if (isSupabaseConfigured()) {
      const dbPublished = await getSupabasePublished();
      if (dbPublished.length > 0) {
        return res.json(dbPublished);
      }
    }
    res.json(store.publishedPackages);
  });

  // Published Packages - Create
  app.post('/api/published', async (req, res) => {
    const pkg = req.body;
    if (!pkg || !pkg.id) {
      return res.status(400).json({ error: 'Invalid package payload' });
    }

    if (isSupabaseConfigured()) {
      await upsertSupabasePublished(pkg).catch(() => {});
    }

    const idx = store.publishedPackages.findIndex(p => p.id === pkg.id);
    if (idx >= 0) {
      store.publishedPackages[idx] = pkg;
    } else {
      store.publishedPackages.unshift(pkg);
    }
    saveStore(store);
    broadcast('new_published', pkg);
    res.json({ success: true, package: pkg });
  });

  // Published Packages - Like
  app.post('/api/published/:id/like', async (req, res) => {
    const { id } = req.params;
    const { username } = req.body;
    const user = username || 'guest';

    let likesCount = 0;
    let likedBy: string[] = [];

    if (isSupabaseConfigured()) {
      const resLike = await updateSupabasePublishedLike(id, user);
      likesCount = resLike.likesCount;
      likedBy = resLike.likedBy;
    }

    const pkg = store.publishedPackages.find(p => p.id === id);
    if (pkg) {
      if (!isSupabaseConfigured()) {
        pkg.likedBy = pkg.likedBy || [];
        if (pkg.likedBy.includes(user)) {
          pkg.likedBy = pkg.likedBy.filter((u: string) => u !== user);
          pkg.likesCount = Math.max(0, (pkg.likesCount || 1) - 1);
        } else {
          pkg.likedBy.push(user);
          pkg.likesCount = (pkg.likesCount || 0) + 1;
        }
        likesCount = pkg.likesCount;
        likedBy = pkg.likedBy;
      } else {
        pkg.likesCount = likesCount;
        pkg.likedBy = likedBy;
      }
      saveStore(store);
    }

    broadcast('published_liked', { id, likesCount, likedBy });
    res.json({ success: true, likesCount, likedBy });
  });

  // Published Packages - Download Counter
  app.post('/api/published/:id/download', async (req, res) => {
    const { id } = req.params;
    let downloadsCount = 1;

    if (isSupabaseConfigured()) {
      downloadsCount = await incrementSupabasePublishedDownload(id);
    }

    const pkg = store.publishedPackages.find(p => p.id === id);
    if (pkg) {
      pkg.downloadsCount = downloadsCount;
      saveStore(store);
    }
    broadcast('published_downloaded', { id, downloadsCount });
    res.json({ success: true, downloadsCount });
  });

  // --- VITE DEV SERVER OR STATIC PRODUCTION ---
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NOIR ARCHIVE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
