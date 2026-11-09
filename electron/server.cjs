/**
 * Embedded Express API & Static Server for Noir Archive Desktop (Windows Electron)
 * Automatically handles persistent storage in Windows %APPDATA%/Noir Archive/
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');

function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash_${Math.abs(hash).toString(16)}_${password.length}`;
}

const AVATAR_COLORS = [
  { hex: '#8b5cf6', secondary: '#6d28d9' },
  { hex: '#ec4899', secondary: '#be185d' },
  { hex: '#06b6d4', secondary: '#0e7490' },
  { hex: '#10b981', secondary: '#047857' },
  { hex: '#f59e0b', secondary: '#b45309' },
  { hex: '#ef4444', secondary: '#b91c1c' },
  { hex: '#3b82f6', secondary: '#1d4ed8' },
  { hex: '#14b8a6', secondary: '#0f766e' },
  { hex: '#f97316', secondary: '#c2410c' },
  { hex: '#6366f1', secondary: '#4338ca' },
  { hex: '#d946ef', secondary: '#a21caf' },
  { hex: '#84cc16', secondary: '#4d7c0f' },
];

function generateStandardAvatar(username) {
  const clean = (username || '').replace(/^@/, '').trim();
  let char = 'N';
  if (clean.toLowerCase() === 'k3nanbaba' || clean.toLowerCase().startsWith('k3nan')) {
    char = '3';
  } else if (clean.length > 0) {
    char = clean.charAt(0).toUpperCase();
  }

  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color.hex}" />
        <stop offset="100%" stop-color="${color.secondary}" />
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="64" fill="url(#grad)" />
    <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="800" font-size="62" letter-spacing="-1">${char}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const DEFAULT_USERS = [
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

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

function createDesktopServer({ dataDir, distDir }) {
  const app = express();
  const dbFile = path.join(dataDir, 'server-storage.json');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  function loadStore() {
    try {
      if (fs.existsSync(dbFile)) {
        const content = fs.readFileSync(dbFile, 'utf-8');
        const data = JSON.parse(content);
        const userMap = new Map();
        DEFAULT_USERS.forEach(u => userMap.set(u.username.toLowerCase(), u));
        (data.users || []).forEach(u => userMap.set(u.username.toLowerCase(), u));
        data.users = Array.from(userMap.values());
        return data;
      }
    } catch (err) {
      console.error('[Desktop Server] Error reading store file:', err);
    }

    const initialStore = {
      users: [...DEFAULT_USERS],
      friendRequests: [],
      chatMessages: [],
      transfers: [],
      publishedPackages: [],
    };
    saveStore(initialStore);
    return initialStore;
  }

  function saveStore(data) {
    try {
      fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Desktop Server] Error saving store file:', err);
    }
  }

  let store = loadStore();

  // CORS for cross-origin local and remote requests
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json({ limit: '100mb' }));

  // SSE Event Stream for live desktop sync
  const sseClients = new Set();
  function broadcast(type, data) {
    const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(payload);
      } catch {
        sseClients.delete(client);
      }
    }
  }

  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    res.write(`event: connected\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`);
    sseClients.add(res);
    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // --- API ROUTES ---
  app.get('/api/users', (_req, res) => {
    res.json(store.users.map(sanitizeUser));
  });

  // User search handler supporting:
  // - /api/users/search?q=... or ?query=... or ?username=...
  // - /api/users/search/:query
  // - Optional ?exclude=... or ?current=... to omit the current user
  function handleUserSearch(req, res) {
    const rawQuery = req.query.q || req.query.query || req.query.username || req.params.query || '';
    const query = String(rawQuery).replace(/^@/, '').toLowerCase().trim();
    const rawExclude = req.query.exclude || req.query.current || '';
    const exclude = String(rawExclude).replace(/^@/, '').toLowerCase().trim();

    let matches = [];
    if (!query) {
      matches = store.users;
    } else {
      matches = store.users.filter(
        u =>
          u.username.toLowerCase().includes(query) ||
          (u.bio && u.bio.toLowerCase().includes(query)) ||
          (u.location && u.location.toLowerCase().includes(query))
      );
    }

    if (exclude) {
      matches = matches.filter(u => u.username.toLowerCase() !== exclude);
    }

    res.json(matches.map(sanitizeUser));
  }

  app.get('/api/users/search', handleUserSearch);
  app.get('/api/users/search/:query', handleUserSearch);

  app.get('/api/users/:username', (req, res) => {
    const username = req.params.username.replace(/^@/, '').toLowerCase().trim();
    if (username === 'search') {
      return handleUserSearch(req, res);
    }
    const user = store.users.find(u => u.username.toLowerCase() === username);
    if (!user) {
      return res.status(404).json({ error: `User @${req.params.username} not found` });
    }
    res.json(sanitizeUser(user));
  });

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

    const newUser = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      bio: bio?.trim() || 'Visual artist and photographer.',
      avatar:
        avatar?.trim() ||
        generateStandardAvatar(cleanUsername),
      location: location?.trim() || 'Worldwide',
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
      friends: [],
    };

    store.users.push(newUser);
    saveStore(store);

    res.json({ success: true, user: sanitizeUser(newUser) });
  });

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

  // Update user avatar
  app.post('/api/users/:username/avatar', (req, res) => {
    const username = req.params.username.replace(/^@/, '').toLowerCase().trim();
    const { avatar } = req.body;
    if (!avatar) {
      return res.status(400).json({ error: 'Avatar data is required' });
    }
    const user = store.users.find(u => u.username.toLowerCase() === username);
    if (!user) {
      return res.status(404).json({ error: `User @${req.params.username} not found` });
    }
    user.avatar = avatar;
    saveStore(store);
    res.json({ success: true, user: sanitizeUser(user) });
  });

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
        avatar: user.avatar || generateStandardAvatar(clean),
        location: user.location || '',
        passwordHash: user.passwordHash || hashPassword('password123'),
        createdAt: user.createdAt || new Date().toISOString(),
        friends: user.friends || [],
      });
      saveStore(store);
    } else if (user.avatar && user.avatar !== existing.avatar) {
      existing.avatar = user.avatar;
      saveStore(store);
    }

    res.json({ success: true, users: store.users.map(sanitizeUser) });
  });

  app.get('/api/friend-requests', (req, res) => {
    const user = req.query.user;
    if (user) {
      const clean = user.replace(/^@/, '').toLowerCase();
      const filtered = store.friendRequests.filter(
        r => r.fromUsername.toLowerCase() === clean || r.toUsername.toLowerCase() === clean
      );
      return res.json(filtered);
    }
    res.json(store.friendRequests);
  });

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

  app.post('/api/friend-requests/:id/cancel', (req, res) => {
    const { id } = req.params;
    store.friendRequests = store.friendRequests.filter(r => r.id !== id);
    saveStore(store);
    res.json({ success: true });
  });

  app.get('/api/chat-messages', (req, res) => {
    const { user1, user2 } = req.query;
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

  app.post('/api/chat-messages', (req, res) => {
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

    store.chatMessages.push(newMessage);
    saveStore(store);

    res.json({ success: true, message: newMessage });
  });

  app.get('/api/transfers', (_req, res) => {
    res.json(store.transfers);
  });

  app.post('/api/transfers', (req, res) => {
    const transfer = req.body;
    if (!transfer || !transfer.id) {
      return res.status(400).json({ error: 'Invalid transfer payload' });
    }
    store.transfers.unshift(transfer);
    saveStore(store);
    res.json({ success: true, transfer });
  });

  app.post('/api/transfers/:id/download', (req, res) => {
    const { id } = req.params;
    const t = store.transfers.find(item => item.id === id);
    if (t) {
      t.downloadsCount = (t.downloadsCount || 0) + 1;
      saveStore(store);
    }
    res.json({ success: true });
  });

  app.post('/api/transfers/:id/revoke', (req, res) => {
    const { id } = req.params;
    const t = store.transfers.find(item => item.id === id);
    if (t) {
      t.status = 'revoked';
      saveStore(store);
    }
    res.json({ success: true });
  });

  app.post('/api/transfers/:id/review', (req, res) => {
    const { id } = req.params;
    const { author, rating, comment } = req.body;
    const t = store.transfers.find(item => item.id === id);
    if (!t) {
      return res.status(404).json({ error: 'Transfer not found' });
    }
    const newRev = {
      id: `rev-${Date.now()}`,
      author: author || 'Client',
      rating: Number(rating) || 5,
      comment: comment || '',
      createdAt: new Date().toISOString(),
    };
    t.reviews = [newRev, ...(t.reviews || [])];
    saveStore(store);
    res.json({ success: true, review: newRev });
  });

  app.get('/api/published', (_req, res) => {
    res.json(store.publishedPackages);
  });

  app.post('/api/published', (req, res) => {
    const pkg = req.body;
    if (!pkg || !pkg.id) {
      return res.status(400).json({ error: 'Invalid package payload' });
    }
    store.publishedPackages.unshift(pkg);
    saveStore(store);
    res.json({ success: true, package: pkg });
  });

  app.post('/api/published/:id/like', (req, res) => {
    const { id } = req.params;
    const pkg = store.publishedPackages.find(p => p.id === id);
    if (pkg) {
      pkg.likesCount = (pkg.likesCount || 0) + 1;
      saveStore(store);
    }
    res.json({ success: true });
  });

  app.post('/api/published/:id/download', (req, res) => {
    const { id } = req.params;
    const pkg = store.publishedPackages.find(p => p.id === id);
    if (pkg) {
      pkg.downloadsCount = (pkg.downloadsCount || 0) + 1;
      saveStore(store);
    }
    res.json({ success: true });
  });

  // Desktop diagnostics info
  app.get('/api/desktop/info', (_req, res) => {
    res.json({
      appName: 'Noir Archive Desktop',
      platform: process.platform,
      dataPath: dbFile,
      distPath: distDir,
    });
  });

  // Serve static UI assets in production desktop mode
  if (distDir && fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  return {
    start: () => {
      return new Promise((resolve, reject) => {
        // Try starting on 3000, fallback to random available port if 3000 in use
        const server = http.createServer(app);
        server.listen(0, '127.0.0.1', () => {
          const address = server.address();
          const port = typeof address === 'object' && address ? address.port : 3000;
          console.log(`[Noir Archive Desktop] Internal server running at http://127.0.0.1:${port}`);
          resolve({ server, port, url: `http://127.0.0.1:${port}` });
        });
        server.on('error', reject);
      });
    },
  };
}

module.exports = { createDesktopServer };
