import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

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

interface User {
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
      // Ensure DEFAULT_USERS are present if missing
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

// In-memory store initialized from disk
let store = loadStore();

function sanitizeUser(user: User) {
  const { passwordHash, ...safe } = user;
  return safe;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // --- API ROUTES ---

  // Get all users (public profiles, passwords omitted)
  app.get('/api/users', (_req, res) => {
    res.json(store.users.map(sanitizeUser));
  });

  // Get single user by username
  app.get('/api/users/:username', (req, res) => {
    const username = req.params.username.replace(/^@/, '').toLowerCase();
    const user = store.users.find(u => u.username.toLowerCase() === username);
    if (!user) {
      return res.status(404).json({ error: `User @${req.params.username} not found` });
    }
    res.json(sanitizeUser(user));
  });

  // User Sign Up
  app.post('/api/auth/signup', (req, res) => {
    const { username, password, bio, avatar, location } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.replace(/^@/, '').trim();
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    const existing = store.users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (existing) {
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

    store.users.push(newUser);
    saveStore(store);

    res.json({ success: true, user: sanitizeUser(newUser) });
  });

  // User Sign In
  app.post('/api/auth/signin', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.replace(/^@/, '').trim().toLowerCase();
    const user = store.users.find(u => u.username.toLowerCase() === cleanUsername);

    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json({ success: true, user: sanitizeUser(user) });
  });

  // Client Sync Local User (ensures accounts registered in client browser are merged into backend)
  app.post('/api/users/sync', (req, res) => {
    const { user } = req.body;
    if (!user || !user.username) {
      return res.status(400).json({ error: 'User data required' });
    }

    const clean = user.username.replace(/^@/, '').trim();
    const existing = store.users.find(u => u.username.toLowerCase() === clean.toLowerCase());

    if (!existing) {
      store.users.push({
        id: user.id || `user-${Date.now()}`,
        username: clean,
        bio: user.bio || '',
        avatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        location: user.location || '',
        passwordHash: user.passwordHash || hashPassword('password123'),
        createdAt: user.createdAt || new Date().toISOString(),
        friends: user.friends || [],
      });
      saveStore(store);
    }

    res.json({ success: true, users: store.users.map(sanitizeUser) });
  });

  // Friend Requests - Get
  app.get('/api/friend-requests', (req, res) => {
    const user = req.query.user as string;
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
  app.post('/api/friend-requests', (req, res) => {
    const { fromUsername, toUsername } = req.body;
    if (!fromUsername || !toUsername) {
      return res.status(400).json({ error: 'Sender and recipient handles are required' });
    }

    const from = fromUsername.replace(/^@/, '').trim().toLowerCase();
    const to = toUsername.replace(/^@/, '').trim().toLowerCase();

    if (from === to) {
      return res.status(400).json({ error: 'You cannot send a friend request to yourself.' });
    }

    const targetUser = store.users.find(u => u.username.toLowerCase() === to);
    if (!targetUser) {
      return res.status(404).json({ error: `User @${to} does not exist.` });
    }

    const senderUser = store.users.find(u => u.username.toLowerCase() === from);
    if (senderUser && senderUser.friends?.map(f => f.toLowerCase()).includes(to)) {
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
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    store.friendRequests.unshift(newRequest);
    saveStore(store);

    res.json({ success: true, request: newRequest });
  });

  // Friend Requests - Accept
  app.post('/api/friend-requests/:id/accept', (req, res) => {
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

    saveStore(store);
    res.json({ success: true, users: store.users.map(sanitizeUser) });
  });

  // Friend Requests - Decline
  app.post('/api/friend-requests/:id/decline', (req, res) => {
    const { id } = req.params;
    const request = store.friendRequests.find(r => r.id === id);
    if (!request) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    request.status = 'declined';
    saveStore(store);
    res.json({ success: true });
  });

  // Friend Requests - Cancel
  app.post('/api/friend-requests/:id/cancel', (req, res) => {
    const { id } = req.params;
    store.friendRequests = store.friendRequests.filter(r => r.id !== id);
    saveStore(store);
    res.json({ success: true });
  });

  // Chat Messages - Get
  app.get('/api/chat-messages', (req, res) => {
    const { user1, user2 } = req.query as { user1?: string; user2?: string };
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
  app.post('/api/chat-messages', (req, res) => {
    const { id, senderUsername, recipientUsername, text, attachment } = req.body;
    if (!senderUsername || !recipientUsername || (!text?.trim() && !attachment)) {
      return res.status(400).json({ error: 'Invalid message parameters' });
    }

    const cleanSender = senderUsername.replace(/^@/, '').toLowerCase().trim();
    const cleanRecipient = recipientUsername.replace(/^@/, '').toLowerCase().trim();

    // Prevent duplicate insert if message with same id already exists
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

    store.chatMessages.push(newMessage);
    saveStore(store);

    res.json({ success: true, message: newMessage });
  });

  // Transfers - Get All
  app.get('/api/transfers', (_req, res) => {
    res.json(store.transfers);
  });

  // Transfers - Create
  app.post('/api/transfers', (req, res) => {
    const transfer = req.body;
    if (!transfer || !transfer.id) {
      return res.status(400).json({ error: 'Invalid transfer payload' });
    }
    store.transfers.unshift(transfer);
    saveStore(store);
    res.json({ success: true, transfer });
  });

  // Transfers - Download Counter
  app.post('/api/transfers/:id/download', (req, res) => {
    const { id } = req.params;
    const t = store.transfers.find(item => item.id === id);
    if (t) {
      t.downloadsCount = (t.downloadsCount || 0) + 1;
      saveStore(store);
    }
    res.json({ success: true });
  });

  // Published Packages - Get All
  app.get('/api/published', (_req, res) => {
    res.json(store.publishedPackages);
  });

  // Published Packages - Create
  app.post('/api/published', (req, res) => {
    const pkg = req.body;
    if (!pkg || !pkg.id) {
      return res.status(400).json({ error: 'Invalid package payload' });
    }
    store.publishedPackages.unshift(pkg);
    saveStore(store);
    res.json({ success: true, package: pkg });
  });

  // Published Packages - Like
  app.post('/api/published/:id/like', (req, res) => {
    const { id } = req.params;
    const pkg = store.publishedPackages.find(p => p.id === id);
    if (pkg) {
      pkg.likesCount = (pkg.likesCount || 0) + 1;
      saveStore(store);
    }
    res.json({ success: true });
  });

  // Published Packages - Download Counter
  app.post('/api/published/:id/download', (req, res) => {
    const { id } = req.params;
    const pkg = store.publishedPackages.find(p => p.id === id);
    if (pkg) {
      pkg.downloadsCount = (pkg.downloadsCount || 0) + 1;
      saveStore(store);
    }
    res.json({ success: true });
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
