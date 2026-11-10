import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
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
  updateSupabaseUserSettings,
  getSupabaseGroups,
  createSupabaseGroup,
  updateSupabaseGroup,
  deleteSupabaseGroup,
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
  removeSupabaseFriendship,
  updateSupabaseChatMessageReactions,
  getSupabaseUserByOAuth,
  SUPABASE_PROJECT_REF,
  DEFAULT_SUPABASE_URL,
  UserDTO,
  FriendGroupDTO,
} from './src/server/supabase.js';
import { APP_VERSION } from './src/version.js';

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

export function formatBytes(bytes: number): string {
  if (bytes <= 0 || isNaN(bytes)) return '0 B';
  const k = 1024;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, units.length - 1);
  const val = bytes / Math.pow(k, idx);
  return `${val.toFixed(val >= 100 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

export function parseBytes(sizeStr: string): number {
  if (!sizeStr) return 0;
  const clean = sizeStr.trim().toLowerCase();
  const match = clean.match(/^([\d.]+)\s*(b|bytes|kb|mb|gb|tb)?$/);
  if (!match) return 0;
  const num = parseFloat(match[1]) || 0;
  const unit = match[2] || 'b';
  switch (unit) {
    case 'tb':
      return num * 1024 * 1024 * 1024 * 1024;
    case 'gb':
      return num * 1024 * 1024 * 1024;
    case 'mb':
      return num * 1024 * 1024;
    case 'kb':
      return num * 1024;
    default:
      return num;
  }
}

export interface StoredFileRecord {
  id: string;
  name: string;
  size: string;
  sizeBytes: number;
  type: string;
  relativePath?: string;
  folderPath?: string;
  filePath: string;
  uploadedAt: string;
  uploaderUsername?: string;
}

const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
const CHUNKS_DIR = path.resolve(UPLOADS_DIR, '.chunks');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(CHUNKS_DIR)) fs.mkdirSync(CHUNKS_DIR, { recursive: true });

interface UploadSession {
  uploadId: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  relativePath: string;
  totalChunks: number;
  receivedChunks: Set<number>;
  chunkDir: string;
  createdAt: number;
  username?: string;
}

const activeUploads = new Map<string, UploadSession>();

export interface User {
  id: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatar: string;
  customAvatar?: string;
  location?: string;
  passwordHash: string;
  createdAt: string;
  friends: string[];
  selectedTheme?: string;
  groupPrivacy?: 'everyone' | 'friends' | 'nobody';
  settings?: any;
  favoritePackageIds?: string[];
  activeSessions?: any[];
  dateOfBirth?: string;
  isAdult?: boolean;
  oauthId?: string;
  oauthProvider?: string;
}

export interface FriendGroup {
  id: string;
  ownerUsername: string;
  name: string;
  memberUsernames: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface AuthSession {
  id: string;
  token: string;
  userId: string;
  username: string;
  createdAt: string;
  expiresAt: string;
  lastActive: string;
  client?: string;
  ip?: string;
}

interface StoreData {
  users: User[];
  friendRequests: any[];
  chatMessages: any[];
  transfers: any[];
  publishedPackages: any[];
  groups: FriendGroup[];
  reports?: any[];
  sessions: AuthSession[];
  files?: StoredFileRecord[];
}

export function calculateAge(dobString?: string): number {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

const DEFAULT_USERS: User[] = [
  {
    id: 'user-moritz',
    username: 'moritz',
    displayName: 'Moritz',
    bio: 'Software engineer and file sharing enthusiast. Sending project archives and developer packages.',
    avatar: '',
    location: 'Berlin',
    passwordHash: hashPassword('password123'),
    createdAt: '2024-01-15T10:00:00.000Z',
    friends: ['elena_k', 'kenji_mono'],
    selectedTheme: 'graphite',
    groupPrivacy: 'friends',
    dateOfBirth: '1998-05-12',
    isAdult: true,
    settings: {
      matureContentFilter: 'warn',
      publicVisibility: 'everyone',
      defaultExpiryDays: 7,
      notificationSounds: true,
      seasonalEffectsEnabled: true,
      language: 'en',
    },
    favoritePackageIds: [],
    activeSessions: [
      { id: 'sess-1', client: 'Chrome 124 (macOS)', ip: '192.168.1.10', lastActive: 'Just now', current: true },
      { id: 'sess-2', client: 'Noir Archive Desktop v1.0', ip: '192.168.1.15', lastActive: '2 hours ago' },
    ],
  },
  {
    id: 'user-elena',
    username: 'elena_k',
    displayName: 'Elena K.',
    bio: 'Product designer and multimedia collaborator. Sharing asset libraries and design folders.',
    avatar: '',
    location: 'Paris',
    passwordHash: hashPassword('secret456'),
    createdAt: '2024-02-01T12:00:00.000Z',
    friends: ['moritz'],
    selectedTheme: 'graphite',
    groupPrivacy: 'friends',
    dateOfBirth: '1999-11-20',
    isAdult: true,
    settings: {
      matureContentFilter: 'warn',
      publicVisibility: 'everyone',
      defaultExpiryDays: 14,
      notificationSounds: true,
      seasonalEffectsEnabled: true,
      language: 'en',
    },
    favoritePackageIds: [],
  },
  {
    id: 'user-kenji',
    username: 'kenji_mono',
    displayName: 'Kenji Mono',
    bio: 'System architect. Exchanging encrypted datasets and engineering build bundles.',
    avatar: '',
    location: 'Tokyo',
    passwordHash: hashPassword('mono789'),
    createdAt: '2024-03-10T09:30:00.000Z',
    friends: ['moritz'],
    selectedTheme: 'graphite',
    groupPrivacy: 'friends',
    dateOfBirth: '1996-03-15',
    isAdult: true,
    settings: {
      matureContentFilter: 'warn',
      publicVisibility: 'everyone',
      defaultExpiryDays: 30,
      notificationSounds: false,
      seasonalEffectsEnabled: true,
      language: 'en',
    },
    favoritePackageIds: [],
  },
  {
    id: 'user-daddy',
    username: 'daddy',
    displayName: 'Daddy',
    bio: 'Verified member & archive curator.',
    avatar: '',
    location: 'Berlin',
    passwordHash: hashPassword('password123'),
    createdAt: '2024-04-01T09:30:00.000Z',
    friends: [],
    selectedTheme: 'graphite',
    groupPrivacy: 'friends',
    dateOfBirth: '1995-01-10',
    isAdult: true,
    settings: {
      matureContentFilter: 'warn',
      publicVisibility: 'everyone',
      defaultExpiryDays: 7,
      notificationSounds: true,
      seasonalEffectsEnabled: true,
      language: 'en',
    },
    favoritePackageIds: [],
  },
];

function loadStore(): StoreData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      const userMap = new Map<string, User>();
      DEFAULT_USERS.forEach(u => userMap.set(u.username.toLowerCase(), u));
      (data.users || []).forEach((u: User) => {
        const def = userMap.get(u.username.toLowerCase());
        const dob = u.dateOfBirth || def?.dateOfBirth;
        const isAdult = dob ? calculateAge(dob) >= 18 : true;
        userMap.set(u.username.toLowerCase(), {
          ...def,
          ...u,
          avatar: '', // Purge any legacy human photo URLs
          customAvatar: u.customAvatar || def?.customAvatar || undefined,
          displayName: u.displayName || def?.displayName || u.username,
          selectedTheme: u.selectedTheme || def?.selectedTheme || 'graphite',
          groupPrivacy: u.groupPrivacy || def?.groupPrivacy || 'friends',
          dateOfBirth: dob,
          isAdult,
          oauthId: u.oauthId || def?.oauthId || undefined,
          oauthProvider: u.oauthProvider || def?.oauthProvider || undefined,
          settings: { ...(def?.settings || {}), ...(u.settings || {}) },
          favoritePackageIds: Array.isArray(u.favoritePackageIds) ? u.favoritePackageIds : (def?.favoritePackageIds || []),
          activeSessions: Array.isArray(u.activeSessions) ? u.activeSessions : (def?.activeSessions || []),
        });
      });
      data.users = Array.from(userMap.values());
      data.groups = Array.isArray(data.groups) ? data.groups : [];
      data.reports = Array.isArray(data.reports) ? data.reports : [];
      data.sessions = Array.isArray(data.sessions) ? data.sessions : [];
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
    groups: [],
    sessions: [],
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

function sanitizeUser(user: User | UserDTO, isSelf = false) {
  const { passwordHash, dateOfBirth, ...safe } = user as any;
  const isAdult = dateOfBirth ? calculateAge(dateOfBirth) >= 18 : true;
  return {
    ...safe,
    isAdult,
    ...(isSelf && dateOfBirth ? { dateOfBirth } : {}),
  };
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  const list: Record<string, string> = {};
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts[0]?.trim();
    if (name) {
      list[name] = decodeURIComponent(parts.slice(1).join('=').trim());
    }
  });
  return list;
}

function parseClientUserAgent(ua?: string): string {
  if (!ua) return 'Web Browser';
  if (/electron/i.test(ua)) return 'Noir Archive Desktop v1.0';
  if (/chrome/i.test(ua) && !/edg/i.test(ua)) {
    if (/mac/i.test(ua)) return 'Chrome (macOS)';
    if (/win/i.test(ua)) return 'Chrome (Windows)';
    if (/android/i.test(ua)) return 'Chrome (Android)';
    return 'Chrome';
  }
  if (/firefox/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
  if (/edg/i.test(ua)) return 'Edge';
  return 'Web Client';
}

function getSessionToken(req: express.Request): string | null {
  // 1. Primary: HttpOnly session cookie
  const cookies = parseCookies(req.headers.cookie);
  if (cookies['noir_auth_session']) {
    return cookies['noir_auth_session'];
  }
  // 2. Secondary: Authorization: Bearer <token> (for desktop clients & API consumers)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

function setSessionCookie(res: express.Response, req: express.Request, token: string) {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie('noir_auth_session', token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days persistent session (like Gmail)
  });
}

function clearSessionCookie(res: express.Response, req: express.Request) {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.clearCookie('noir_auth_session', {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    path: '/',
  });
}

function getCurrentSessionUser(req: express.Request): User | null {
  const token = getSessionToken(req);
  if (!token) return null;
  const session = (store.sessions || []).find(s => s.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt) <= new Date()) return null;
  const user = store.users.find(u => u.username.toLowerCase() === session.username.toLowerCase());
  return user || null;
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
    const origin = req.headers.origin;
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    } else {
      res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Streaming raw binary chunk upload (placed before body parsers to stream directly to disk without RAM buffering)
  app.put('/api/upload/chunk/:uploadId', (req, res) => {
    const { uploadId } = req.params;
    const chunkIndexStr = (req.query.chunkIndex as string) || (req.headers['x-chunk-index'] as string);
    const chunkIndex = parseInt(chunkIndexStr, 10);

    const session = activeUploads.get(uploadId);
    if (!session) {
      return res.status(404).json({ error: 'Upload session not found or expired' });
    }
    if (isNaN(chunkIndex) || chunkIndex < 0 || chunkIndex >= session.totalChunks) {
      return res.status(400).json({ error: `Invalid chunk index: ${chunkIndexStr}` });
    }

    const chunkFilePath = path.join(session.chunkDir, `chunk_${chunkIndex}`);
    const writeStream = fs.createWriteStream(chunkFilePath);

    req.pipe(writeStream);

    writeStream.on('finish', () => {
      session.receivedChunks.add(chunkIndex);
      res.json({
        success: true,
        chunkIndex,
        receivedChunksCount: session.receivedChunks.size,
        totalChunks: session.totalChunks,
      });
    });

    writeStream.on('error', (err) => {
      console.error(`Error writing chunk ${chunkIndex} for upload ${uploadId}:`, err);
      res.status(500).json({ error: 'Failed to write chunk to storage' });
    });

    req.on('error', (err) => {
      console.error(`Request error during chunk ${chunkIndex} for upload ${uploadId}:`, err);
      writeStream.destroy();
      res.status(500).json({ error: 'Network error during chunk stream' });
    });
  });

  app.use(express.json({ limit: '100mb' }));

  // Storage usage and infrastructure information
  app.get('/api/storage/info', (req, res) => {
    const username = (req.query.username as string) || '';
    const cleanUser = username.replace(/^@/, '').toLowerCase().trim();

    let totalStorageBytes = 0;
    let userStorageBytes = 0;
    let userFilesCount = 0;
    let totalFilesCount = 0;

    for (const t of store.transfers || []) {
      const isOwner = cleanUser && t.senderUsername?.toLowerCase() === cleanUser;
      for (const f of t.files || []) {
        const b = f.sizeBytes || parseBytes(f.size);
        totalStorageBytes += b;
        totalFilesCount++;
        if (isOwner) {
          userStorageBytes += b;
          userFilesCount++;
        }
      }
    }

    for (const p of store.publishedPackages || []) {
      const isAuthor = cleanUser && p.authorUsername?.toLowerCase() === cleanUser;
      for (const f of p.files || []) {
        const b = f.sizeBytes || parseBytes(f.size);
        totalStorageBytes += b;
        totalFilesCount++;
        if (isAuthor) {
          userStorageBytes += b;
          userFilesCount++;
        }
      }
    }

    let diskUsedBytes = 0;
    try {
      if (fs.existsSync(UPLOADS_DIR)) {
        const files = fs.readdirSync(UPLOADS_DIR);
        for (const file of files) {
          if (file === '.chunks') continue;
          const s = fs.statSync(path.join(UPLOADS_DIR, file));
          if (s.isFile()) diskUsedBytes += s.size;
        }
      }
    } catch {}

    res.json({
      user: {
        username: cleanUser,
        usedBytes: userStorageBytes,
        usedFormatted: formatBytes(userStorageBytes),
        filesCount: userFilesCount,
      },
      platform: {
        totalBytes: totalStorageBytes,
        totalFormatted: formatBytes(totalStorageBytes),
        totalFilesCount,
        diskUsedBytes,
        diskUsedFormatted: formatBytes(diskUsedBytes),
      },
      architecture: {
        system: 'Noir Archive Dynamic Streaming Storage Engine',
        arbitraryAccountLimit: null, // Hardcoded 10 GB limit completely removed
        maxSingleTransferBytes: null, // No arbitrary file or transfer limits
        chunkSize: '5 MB chunked slicing with zero server-RAM buffering',
        streaming: 'Direct disk streaming with HTTP Range resumable downloads',
        providers: {
          backendHosting: {
            name: 'Render Web Service',
            memoryLimit: '512 MB Container RAM (Streamed chunk I/O eliminates memory spikes)',
            requestTimeout: '100s per chunk request',
            filesystem: 'Local streaming disk with persistent volume support',
          },
          database: {
            name: 'Supabase PostgreSQL',
            projectRef: SUPABASE_PROJECT_REF,
            freeTierLimit: '500 MB DB size / 1 GB Object Storage (50 GB Pro)',
            status: supabaseStatus.connected ? 'Connected' : 'Local Disk Fallback Mode',
          },
        },
      },
    });
  });

  // Init chunked upload session
  app.post('/api/upload/init', (req, res) => {
    const { fileName, fileSize, fileType, relativePath, totalChunks, username } = req.body;
    if (!fileName || typeof fileSize !== 'number' || typeof totalChunks !== 'number') {
      return res.status(400).json({ error: 'Invalid upload init parameters' });
    }
    const uploadId = `up_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const fileId = `file_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const chunkDir = path.join(CHUNKS_DIR, uploadId);
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir, { recursive: true });
    }

    const session: UploadSession = {
      uploadId,
      fileId,
      fileName,
      fileSize,
      fileType: fileType || 'application/octet-stream',
      relativePath: relativePath || fileName,
      totalChunks,
      receivedChunks: new Set<number>(),
      chunkDir,
      createdAt: Date.now(),
      username: username || 'anonymous',
    };

    activeUploads.set(uploadId, session);

    res.json({
      success: true,
      uploadId,
      fileId,
      chunkSize: 5 * 1024 * 1024,
      totalChunks,
    });
  });

  // Check upload status (for pause / resume)
  app.get('/api/upload/status/:uploadId', (req, res) => {
    const { uploadId } = req.params;
    const session = activeUploads.get(uploadId);
    if (!session) {
      return res.status(404).json({ error: 'Upload session not found or expired' });
    }
    res.json({
      uploadId,
      fileId: session.fileId,
      totalChunks: session.totalChunks,
      receivedChunks: Array.from(session.receivedChunks).sort((a, b) => a - b),
      progress: session.receivedChunks.size / session.totalChunks,
    });
  });

  // Finalize chunked upload and assemble file
  app.post('/api/upload/complete/:uploadId', async (req, res) => {
    const { uploadId } = req.params;
    const session = activeUploads.get(uploadId);
    if (!session) {
      return res.status(404).json({ error: 'Upload session not found or expired' });
    }

    if (session.receivedChunks.size !== session.totalChunks) {
      return res.status(400).json({
        error: `Incomplete upload: received ${session.receivedChunks.size} of ${session.totalChunks} chunks`,
        receivedChunks: Array.from(session.receivedChunks),
      });
    }

    const safeName = session.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const finalFileName = `${session.fileId}_${safeName}`;
    const finalFilePath = path.join(UPLOADS_DIR, finalFileName);
    const writeFinalStream = fs.createWriteStream(finalFilePath);

    try {
      for (let i = 0; i < session.totalChunks; i++) {
        const chunkPath = path.join(session.chunkDir, `chunk_${i}`);
        if (!fs.existsSync(chunkPath)) {
          throw new Error(`Missing chunk ${i} during assembly`);
        }
        await new Promise<void>((resolve, reject) => {
          const readChunkStream = fs.createReadStream(chunkPath);
          readChunkStream.pipe(writeFinalStream, { end: false });
          readChunkStream.on('end', () => resolve());
          readChunkStream.on('error', reject);
        });
      }
      writeFinalStream.end();

      // Clean up chunk files and directory
      try {
        fs.rmSync(session.chunkDir, { recursive: true, force: true });
      } catch (rmErr) {
        console.warn('Could not remove chunk dir:', rmErr);
      }

      const fileRecord: StoredFileRecord = {
        id: session.fileId,
        name: session.fileName,
        size: formatBytes(session.fileSize),
        sizeBytes: session.fileSize,
        type: session.fileType,
        relativePath: session.relativePath,
        folderPath: session.relativePath.includes('/') ? path.dirname(session.relativePath) : undefined,
        filePath: finalFilePath,
        uploadedAt: new Date().toISOString(),
        uploaderUsername: session.username,
      };

      store.files = store.files || [];
      store.files.push(fileRecord);
      saveStore(store);

      activeUploads.delete(uploadId);

      res.json({
        success: true,
        file: {
          id: fileRecord.id,
          name: fileRecord.name,
          size: fileRecord.size,
          sizeBytes: fileRecord.sizeBytes,
          type: fileRecord.type,
          relativePath: fileRecord.relativePath,
          downloadUrl: `/api/files/download/${fileRecord.id}`,
        },
      });
    } catch (err: any) {
      console.error('Failed to merge chunks:', err);
      writeFinalStream.destroy();
      try {
        if (fs.existsSync(finalFilePath)) fs.unlinkSync(finalFilePath);
      } catch {}
      res.status(500).json({ error: `Failed to finalize file: ${err?.message || 'Merge error'}` });
    }
  });

  // Streaming file download with HTTP Range header support (for resumable & large file downloads)
  app.get('/api/files/download/:fileId', (req, res) => {
    const { fileId } = req.params;
    const fileRecord = (store.files || []).find(f => f.id === fileId);
    if (!fileRecord || !fs.existsSync(fileRecord.filePath)) {
      return res.status(404).json({ error: 'File not found on storage server' });
    }

    const stat = fs.statSync(fileRecord.filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const safeFilename = encodeURIComponent(fileRecord.name);
    res.setHeader('Content-Type', fileRecord.type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${safeFilename}`);
    res.setHeader('Accept-Ranges', 'bytes');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize || start > end) {
        res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
        return res.end();
      }

      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(fileRecord.filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': chunksize,
      });
      fileStream.pipe(res);
    } else {
      res.setHeader('Content-Length', fileSize);
      const fileStream = fs.createReadStream(fileRecord.filePath);
      fileStream.pipe(res);
    }
  });

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

  // Client-safe Auth & Supabase configuration
  app.get('/api/config/auth', (_req, res) => {
    res.json({
      supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL,
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy',
      projectRef: SUPABASE_PROJECT_REF,
    });
  });

  // Diagnostics and Health Check (reporting Supabase connection status)
  app.get('/api/health', async (_req, res) => {
    const currentStatus = isSupabaseConfigured() ? await testSupabaseConnection() : { connected: false, message: 'SUPABASE_SERVICE_ROLE_KEY not set' };
    res.json({
      status: 'ok',
      version: APP_VERSION,
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

  // User search handler supporting:
  // - /api/users/search?q=... or ?query=... or ?username=...
  // - /api/users/search/:query
  // - Optional ?exclude=... or ?current=... to omit the current user
  async function handleUserSearch(req: express.Request, res: express.Response) {
    const rawQuery = (req.query.q || req.query.query || req.query.username || req.params.query || '') as string;
    const query = String(rawQuery).replace(/^@/, '').toLowerCase().trim();
    const rawExclude = (req.query.exclude || req.query.current || '') as string;
    const exclude = String(rawExclude).replace(/^@/, '').toLowerCase().trim();

    let matches: (User | UserDTO)[] = [];

    if (isSupabaseConfigured()) {
      matches = query ? await searchSupabaseUsers(query) : await getSupabaseUsers();
    } else {
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
    }

    if (exclude) {
      matches = matches.filter(u => u.username.toLowerCase() !== exclude);
    }

    return res.json(matches.map(sanitizeUser));
  }

  // Both search route formats supported
  app.get('/api/users/search', handleUserSearch);
  app.get('/api/users/search/:query', handleUserSearch);

  // Get single user by username
  app.get('/api/users/:username', async (req, res) => {
    const username = req.params.username.replace(/^@/, '').toLowerCase().trim();
    if (username === 'search') {
      return handleUserSearch(req, res);
    }

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

  // Update user settings (Theme, Privacy, Bio, Location, Custom Avatar, Preferences)
  app.put('/api/users/:username/settings', async (req, res) => {
    const username = req.params.username.replace(/^@/, '').toLowerCase().trim();
    const { selectedTheme, groupPrivacy, bio, location, displayName, customAvatar, settings, favoritePackageIds } = req.body;

    let updatedUser: User | null = null;
    const idx = store.users.findIndex(u => u.username.toLowerCase() === username);
    if (idx >= 0) {
      if (selectedTheme) store.users[idx].selectedTheme = selectedTheme;
      if (groupPrivacy) store.users[idx].groupPrivacy = groupPrivacy;
      if (bio !== undefined) store.users[idx].bio = bio;
      if (location !== undefined) store.users[idx].location = location;
      if (displayName !== undefined) store.users[idx].displayName = displayName;
      if (customAvatar !== undefined) store.users[idx].customAvatar = customAvatar || undefined;
      if (settings !== undefined) {
        store.users[idx].settings = { ...(store.users[idx].settings || {}), ...settings };
      }
      if (Array.isArray(favoritePackageIds)) {
        store.users[idx].favoritePackageIds = favoritePackageIds;
      }
      updatedUser = store.users[idx];
      saveStore(store);
    }

    if (isSupabaseConfigured()) {
      try {
        await updateSupabaseUserSettings(username, {
          selectedTheme,
          groupPrivacy,
          bio,
          location,
          displayName,
          customAvatar,
          settings,
          favoritePackageIds,
        });
      } catch {}
    }

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    broadcast('user_updated', sanitizeUser(updatedUser));
    res.json({ success: true, user: sanitizeUser(updatedUser) });
  });

  // Change Password endpoint
  app.put('/api/users/:username/password', async (req, res) => {
    const username = req.params.username.replace(/^@/, '').toLowerCase().trim();
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const idx = store.users.findIndex(u => u.username.toLowerCase() === username);
    if (idx < 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = store.users[idx];
    if (user.passwordHash !== hashPassword(currentPassword)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.passwordHash = hashPassword(newPassword);
    saveStore(store);

    res.json({ success: true, message: 'Password updated successfully' });
  });


  // User Sign Up
  app.post('/api/auth/signup', async (req, res) => {
    const { username, password, bio, location, selectedTheme, groupPrivacy, dateOfBirth, customAvatar } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.replace(/^@/, '').trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    // Validate Date of Birth if provided
    let isAdult = true;
    if (dateOfBirth) {
      const age = calculateAge(dateOfBirth);
      if (age < 0 || age > 130) {
        return res.status(400).json({ error: 'Please enter a valid Date of Birth' });
      }
      isAdult = age >= 18;
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
      bio: bio?.trim() || 'Noir Archive file sharing member.',
      avatar: '', // Strict letter-based avatars: no human photos
      customAvatar: customAvatar || undefined,
      location: location?.trim() || 'Worldwide',
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
      friends: [],
      selectedTheme: selectedTheme || 'graphite',
      groupPrivacy: groupPrivacy || 'friends',
      dateOfBirth: dateOfBirth || undefined,
      isAdult,
      oauthProvider: 'email',
    };

    if (isSupabaseConfigured()) {
      try {
        await createSupabaseUser(newUser);
      } catch (err: any) {
        console.error('[Supabase Signup Error]:', err.message);
      }
    }

    // Generate secure persistent session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const newSession: AuthSession = {
      id: `sess_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      token: sessionToken,
      userId: newUser.id,
      username: newUser.username,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastActive: new Date().toISOString(),
      client: parseClientUserAgent(req.headers['user-agent']),
      ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1',
    };

    store.sessions = store.sessions || [];
    store.sessions.push(newSession);

    newUser.activeSessions = [
      {
        id: newSession.id,
        client: newSession.client || 'Web Browser',
        ip: newSession.ip || '127.0.0.1',
        lastActive: 'Just now',
        current: true,
      },
    ];

    store.users.push(newUser);
    saveStore(store);

    setSessionCookie(res, req, sessionToken);
    broadcast('user_registered', sanitizeUser(newUser));
    res.json({
      success: true,
      user: sanitizeUser(newUser, true),
      session: {
        id: newSession.id,
        expiresAt: newSession.expiresAt,
      },
      sessionToken,
    });
  });

  // OAuth Session Sync (Returning OAuth user or initiate handle/DOB setup)
  app.post('/api/auth/oauth-sync', async (req, res) => {
    const { oauthId, email, provider, fullName, avatarUrl } = req.body;
    if (!oauthId) {
      return res.status(400).json({ error: 'OAuth ID is required' });
    }

    let existingUser: User | UserDTO | null = null;
    if (isSupabaseConfigured()) {
      existingUser = await getSupabaseUserByOAuth(oauthId);
    }
    if (!existingUser) {
      existingUser = store.users.find(u => u.oauthId === oauthId) || null;
    }

    // If already registered and linked, automatically establish persistent session!
    if (existingUser) {
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const newSession: AuthSession = {
        id: `sess_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        token: sessionToken,
        userId: existingUser.id,
        username: existingUser.username,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastActive: new Date().toISOString(),
        client: parseClientUserAgent(req.headers['user-agent']),
        ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1',
      };

      store.sessions = store.sessions || [];
      store.sessions.push(newSession);
      saveStore(store);

      setSessionCookie(res, req, sessionToken);
      return res.json({
        authenticated: true,
        user: sanitizeUser(existingUser, true),
        session: {
          id: newSession.id,
          expiresAt: newSession.expiresAt,
        },
        sessionToken,
      });
    }

    // First time OAuth user: return requiresRegistration so they can select a unique username & Date of Birth
    const suggestedUsername = (
      email ? email.split('@')[0] : fullName ? fullName.replace(/\s+/g, '_') : 'user'
    ).toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);

    return res.json({
      authenticated: false,
      requiresRegistration: true,
      oauthId,
      email: email || '',
      provider: provider || 'oauth',
      suggestedUsername,
      avatarUrl: avatarUrl || '',
    });
  });

  // OAuth Registration Completion (first-time OAuth user setting unique username & Date of Birth)
  app.post('/api/auth/oauth-complete', async (req, res) => {
    const { oauthId, oauthProvider, username, displayName, dateOfBirth, avatarUrl, bio } = req.body;
    if (!oauthId || !username) {
      return res.status(400).json({ error: 'OAuth ID and username are required' });
    }

    const cleanUsername = username.replace(/^@/, '').trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    // Age calculation
    let isAdult = true;
    if (dateOfBirth) {
      const age = calculateAge(dateOfBirth);
      if (age < 0 || age > 130) {
        return res.status(400).json({ error: 'Please enter a valid Date of Birth' });
      }
      isAdult = age >= 18;
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
      displayName: displayName || cleanUsername,
      bio: bio?.trim() || 'Noir Archive file sharing member.',
      avatar: '',
      customAvatar: avatarUrl || undefined,
      location: 'Worldwide',
      passwordHash: hashPassword(crypto.randomBytes(16).toString('hex')),
      createdAt: new Date().toISOString(),
      friends: [],
      selectedTheme: 'graphite',
      groupPrivacy: 'friends',
      dateOfBirth: dateOfBirth || undefined,
      isAdult,
      oauthId,
      oauthProvider: oauthProvider || 'oauth',
    };

    if (isSupabaseConfigured()) {
      try {
        await createSupabaseUser(newUser);
      } catch (err: any) {
        console.error('[Supabase OAuth User Create Error]:', err.message);
      }
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const newSession: AuthSession = {
      id: `sess_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      token: sessionToken,
      userId: newUser.id,
      username: newUser.username,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastActive: new Date().toISOString(),
      client: parseClientUserAgent(req.headers['user-agent']),
      ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1',
    };

    store.sessions = store.sessions || [];
    store.sessions.push(newSession);

    newUser.activeSessions = [
      {
        id: newSession.id,
        client: newSession.client || 'Web Browser',
        ip: newSession.ip || '127.0.0.1',
        lastActive: 'Just now',
        current: true,
      },
    ];

    store.users.push(newUser);
    saveStore(store);

    setSessionCookie(res, req, sessionToken);
    broadcast('user_registered', sanitizeUser(newUser));
    res.json({
      success: true,
      user: sanitizeUser(newUser, true),
      session: {
        id: newSession.id,
        expiresAt: newSession.expiresAt,
      },
      sessionToken,
    });
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

    // Generate secure persistent session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const newSession: AuthSession = {
      id: `sess_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      token: sessionToken,
      userId: user.id,
      username: user.username,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastActive: new Date().toISOString(),
      client: parseClientUserAgent(req.headers['user-agent']),
      ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1',
    };

    store.sessions = store.sessions || [];
    store.sessions.push(newSession);

    const userObj = store.users.find(u => u.username.toLowerCase() === cleanUsername);
    if (userObj) {
      userObj.activeSessions = [
        {
          id: newSession.id,
          client: newSession.client || 'Web Browser',
          ip: newSession.ip || '127.0.0.1',
          lastActive: 'Just now',
          current: true,
        },
        ...(userObj.activeSessions || []).filter(s => s.id !== newSession.id).slice(0, 4),
      ];
    }
    saveStore(store);

    setSessionCookie(res, req, sessionToken);
    res.json({
      success: true,
      user: sanitizeUser(user),
      session: {
        id: newSession.id,
        expiresAt: newSession.expiresAt,
      },
      sessionToken,
    });
  });

  // Verify and restore persistent session (like Gmail)
  app.get('/api/auth/session', async (req, res) => {
    const token = getSessionToken(req);
    if (!token) {
      return res.json({ authenticated: false, message: 'No session token found' });
    }

    store.sessions = store.sessions || [];
    const session = store.sessions.find(s => s.token === token);
    if (!session) {
      clearSessionCookie(res, req);
      return res.json({ authenticated: false, message: 'Invalid or revoked session' });
    }

    if (new Date(session.expiresAt) <= new Date()) {
      store.sessions = store.sessions.filter(s => s.token !== token);
      clearSessionCookie(res, req);
      saveStore(store);
      return res.json({ authenticated: false, message: 'Session expired' });
    }

    // Refresh last active timestamp
    session.lastActive = new Date().toISOString();

    let user: User | UserDTO | null = null;
    if (isSupabaseConfigured()) {
      user = await getSupabaseUserByUsername(session.username);
    }
    if (!user) {
      user = store.users.find(u => u.username.toLowerCase() === session.username.toLowerCase()) || null;
    }

    if (!user) {
      store.sessions = store.sessions.filter(s => s.token !== token);
      clearSessionCookie(res, req);
      saveStore(store);
      return res.json({ authenticated: false, message: 'User account not found' });
    }

    saveStore(store);

    // Refresh cookie expiry so active users stay logged in smoothly
    setSessionCookie(res, req, token);

    res.json({
      authenticated: true,
      user: sanitizeUser(user),
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
        client: session.client,
        lastActive: session.lastActive,
      },
    });
  });

  // Sign Out current session
  app.post('/api/auth/signout', (req, res) => {
    const token = getSessionToken(req);
    if (token) {
      store.sessions = (store.sessions || []).filter(s => s.token !== token);
      saveStore(store);
    }
    clearSessionCookie(res, req);
    res.json({ success: true, message: 'Logged out successfully' });
  });

  // Sign Out of all sessions (Option to log out of all sessions)
  app.post('/api/auth/signout-all', (req, res) => {
    const token = getSessionToken(req);
    if (token) {
      const session = (store.sessions || []).find(s => s.token === token);
      if (session) {
        store.sessions = (store.sessions || []).filter(s => s.username.toLowerCase() !== session.username.toLowerCase());
        const userObj = store.users.find(u => u.username.toLowerCase() === session.username.toLowerCase());
        if (userObj) {
          userObj.activeSessions = [];
        }
        saveStore(store);
      }
    }
    clearSessionCookie(res, req);
    res.json({ success: true, message: 'All sessions revoked successfully' });
  });

  // Get active sessions for current user
  app.get('/api/auth/sessions', (req, res) => {
    const token = getSessionToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const currentSession = (store.sessions || []).find(s => s.token === token);
    if (!currentSession) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const userSessions = (store.sessions || [])
      .filter(s => s.username.toLowerCase() === currentSession.username.toLowerCase())
      .map(s => ({
        id: s.id,
        client: s.client || 'Web Browser',
        ip: s.ip || '127.0.0.1',
        lastActive: s.token === token ? 'Just now (This Browser)' : s.lastActive,
        createdAt: s.createdAt,
        current: s.token === token,
      }));

    res.json({ success: true, sessions: userSessions });
  });

  // Revoke specific session by ID
  app.delete('/api/auth/sessions/:sessionId', (req, res) => {
    const token = getSessionToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const currentSession = (store.sessions || []).find(s => s.token === token);
    if (!currentSession) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const { sessionId } = req.params;
    const target = (store.sessions || []).find(s => s.id === sessionId);
    if (target && target.username.toLowerCase() === currentSession.username.toLowerCase()) {
      store.sessions = store.sessions.filter(s => s.id !== sessionId);
      if (target.token === token) {
        clearSessionCookie(res, req);
      }
      saveStore(store);
      return res.json({ success: true, message: 'Session revoked' });
    }

    res.status(404).json({ error: 'Session not found or unauthorized' });
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

  // Friend Removal - Bidirectional
  const handleFriendRemoval = async (req: express.Request, res: express.Response) => {
    const targetUsername = (req.params.username || req.body.username || req.body.targetUsername || '').replace(/^@/, '').toLowerCase().trim();
    const sessionUser = getCurrentSessionUser(req);
    const currentUsername = (req.body.currentUser || req.body.currentUsername || sessionUser?.username || '').replace(/^@/, '').toLowerCase().trim();

    if (!targetUsername || !currentUsername) {
      return res.status(400).json({ error: 'Current user and target user to remove are required' });
    }

    const u1 = store.users.find(u => u.username.toLowerCase() === currentUsername);
    const u2 = store.users.find(u => u.username.toLowerCase() === targetUsername);

    if (u1) {
      u1.friends = (u1.friends || []).filter(f => f.replace(/^@/, '').toLowerCase().trim() !== targetUsername);
    }
    if (u2) {
      u2.friends = (u2.friends || []).filter(f => f.replace(/^@/, '').toLowerCase().trim() !== currentUsername);
    }

    if (isSupabaseConfigured()) {
      await removeSupabaseFriendship(currentUsername, targetUsername).catch(() => {});
      if (u1) await updateSupabaseUserFriends(u1.username, u1.friends).catch(() => {});
      if (u2) await updateSupabaseUserFriends(u2.username, u2.friends).catch(() => {});
    }

    saveStore(store);
    broadcast('friend_removed', { user1: currentUsername, user2: targetUsername, users: store.users.map(u => sanitizeUser(u, false)) });
    res.json({ success: true, message: `Removed @${targetUsername} from friends`, users: store.users.map(u => sanitizeUser(u, false)) });
  };

  app.delete('/api/friends/:username', handleFriendRemoval);
  app.post('/api/friends/remove', handleFriendRemoval);

  // --- FRIEND GROUPS ---
  // Get groups for a user
  app.get('/api/groups', async (req, res) => {
    const user = req.query.user as string;
    const clean = user ? user.replace(/^@/, '').toLowerCase().trim() : '';

    let groups: FriendGroup[] = [];
    if (isSupabaseConfigured()) {
      groups = await getSupabaseGroups(clean);
    }
    if (groups.length === 0 && store.groups) {
      if (clean) {
        groups = store.groups.filter(
          g => g.ownerUsername.toLowerCase() === clean || g.memberUsernames.map(m => m.toLowerCase()).includes(clean)
        );
      } else {
        groups = store.groups;
      }
    }

    res.json(groups || []);
  });

  // Create Group
  app.post('/api/groups', async (req, res) => {
    const { name, ownerUsername, members } = req.body;
    if (!name || !name.trim() || !ownerUsername) {
      return res.status(400).json({ error: 'Group name and owner username are required' });
    }

    const cleanOwner = ownerUsername.replace(/^@/, '').toLowerCase().trim();
    const initialMembers: string[] = Array.isArray(members)
      ? Array.from(new Set([cleanOwner, ...members.map((m: string) => m.replace(/^@/, '').toLowerCase().trim())]))
      : [cleanOwner];

    const newGroup: FriendGroup = {
      id: `grp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ownerUsername: cleanOwner,
      name: name.trim(),
      memberUsernames: initialMembers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      await createSupabaseGroup(newGroup).catch(() => {});
    }

    store.groups = store.groups || [];
    store.groups.unshift(newGroup);
    saveStore(store);

    broadcast('group_created', newGroup);
    res.json({ success: true, group: newGroup });
  });

  // Rename / Update Group
  app.put('/api/groups/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const group = (store.groups || []).find(g => g.id === id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    group.name = name.trim();
    group.updatedAt = new Date().toISOString();

    if (isSupabaseConfigured()) {
      await updateSupabaseGroup(group).catch(() => {});
    }

    saveStore(store);
    broadcast('group_updated', group);
    res.json({ success: true, group });
  });

  // Delete Group (with Group Owner verification)
  app.delete('/api/groups/:id', async (req, res) => {
    const { id } = req.params;
    const group = (store.groups || []).find(g => g.id === id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const sessionUser = getCurrentSessionUser(req);
    const requestedBy = (req.body?.requesterUsername || req.query?.user || sessionUser?.username || '').toString().replace(/^@/, '').toLowerCase().trim();
    if (sessionUser && group.ownerUsername.toLowerCase() !== sessionUser.username.toLowerCase()) {
      return res.status(403).json({ error: 'Only the group owner can delete this group' });
    } else if (!sessionUser && requestedBy && group.ownerUsername.toLowerCase() !== requestedBy) {
      return res.status(403).json({ error: 'Only the group owner can delete this group' });
    }

    store.groups = (store.groups || []).filter(g => g.id !== id);

    if (isSupabaseConfigured()) {
      await deleteSupabaseGroup(id).catch(() => {});
    }

    saveStore(store);
    broadcast('group_deleted', { id });
    res.json({ success: true, id });
  });

  // Add Member to Group (WITH STRICT PRIVACY CHECK)
  app.post('/api/groups/:id/members', async (req, res) => {
    const { id } = req.params;
    const { username, adderUsername } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const cleanTarget = username.replace(/^@/, '').toLowerCase().trim();
    const cleanAdder = (adderUsername || '').replace(/^@/, '').toLowerCase().trim();

    const group = (store.groups || []).find(g => g.id === id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Lookup target user to verify existence & privacy settings
    let targetUser = store.users.find(u => u.username.toLowerCase() === cleanTarget);
    if (!targetUser && isSupabaseConfigured()) {
      targetUser = (await getSupabaseUserByUsername(cleanTarget)) || undefined;
    }

    if (!targetUser) {
      return res.status(404).json({ error: `User @${cleanTarget} does not exist.` });
    }

    // Group Invitation Privacy Setting check
    const privacy = targetUser.groupPrivacy || 'friends';
    if (privacy === 'nobody' && cleanAdder !== cleanTarget) {
      return res.status(403).json({ error: `@${targetUser.username} does not allow anyone to add them to groups.` });
    }

    if (privacy === 'friends' && cleanAdder !== cleanTarget) {
      const isFriend = (targetUser.friends || []).some(
        f => f.replace(/^@/, '').toLowerCase().trim() === cleanAdder
      );
      if (!isFriend) {
        return res.status(403).json({ error: `@${targetUser.username} only allows friends to add them to groups.` });
      }
    }

    if (!group.memberUsernames.map(m => m.toLowerCase()).includes(cleanTarget)) {
      group.memberUsernames.push(cleanTarget);
      group.updatedAt = new Date().toISOString();

      if (isSupabaseConfigured()) {
        await updateSupabaseGroup(group).catch(() => {});
      }

      saveStore(store);
      broadcast('group_updated', group);
    }

    res.json({ success: true, group });
  });

  // Remove Member from Group
  app.delete('/api/groups/:id/members/:username', async (req, res) => {
    const { id, username } = req.params;
    const cleanMember = username.replace(/^@/, '').toLowerCase().trim();

    const group = (store.groups || []).find(g => g.id === id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    group.memberUsernames = group.memberUsernames.filter(m => m.toLowerCase() !== cleanMember);
    group.updatedAt = new Date().toISOString();

    if (isSupabaseConfigured()) {
      await updateSupabaseGroup(group).catch(() => {});
    }

    saveStore(store);
    broadcast('group_updated', group);
    res.json({ success: true, group });
  });

  // Chat Messages - Get (supports 1-on-1 and Group chats)
  app.get('/api/chat-messages', async (req, res) => {
    const { user1, user2, groupId } = req.query as { user1?: string; user2?: string; groupId?: string };

    if (groupId) {
      if (isSupabaseConfigured()) {
        const messages = await getSupabaseChatMessages(undefined, undefined, groupId);
        if (messages.length > 0) {
          return res.json(messages);
        }
      }
      const groupMsgs = store.chatMessages.filter(m => m.groupId === groupId);
      return res.json(groupMsgs);
    }

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

  // Chat Messages - Send (with group, replies, and reactions support)
  app.post('/api/chat-messages', async (req, res) => {
    const { id, senderUsername, recipientUsername, groupId, text, attachment, replyTo } = req.body;
    if (!senderUsername || (!recipientUsername && !groupId) || (!text?.trim() && !attachment)) {
      return res.status(400).json({ error: 'Invalid message parameters' });
    }

    const cleanSender = senderUsername.replace(/^@/, '').toLowerCase().trim();
    const cleanRecipient = recipientUsername ? recipientUsername.replace(/^@/, '').toLowerCase().trim() : '';

    const msgId = id || `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const existing = store.chatMessages.find(m => m.id === msgId);
    if (existing) {
      return res.json({ success: true, message: existing });
    }

    const newMessage = {
      id: msgId,
      senderUsername: cleanSender,
      recipientUsername: cleanRecipient,
      groupId: groupId || undefined,
      text: text?.trim() || '',
      attachment: attachment || undefined,
      replyTo: replyTo || undefined,
      reactions: {},
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

  // Chat Messages - Emoji Reaction Toggle
  app.post('/api/chat-messages/:id/react', async (req, res) => {
    const { id } = req.params;
    const { emoji, username } = req.body;
    if (!emoji || !username) {
      return res.status(400).json({ error: 'Emoji and username are required' });
    }

    const cleanUser = username.replace(/^@/, '').toLowerCase().trim();
    const message = store.chatMessages.find(m => m.id === id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    message.reactions = message.reactions || {};
    const currentReactions: string[] = Array.isArray(message.reactions[emoji]) ? message.reactions[emoji] : [];
    if (currentReactions.includes(cleanUser)) {
      message.reactions[emoji] = currentReactions.filter(u => u !== cleanUser);
      if (message.reactions[emoji].length === 0) {
        delete message.reactions[emoji];
      }
    } else {
      message.reactions[emoji] = [...currentReactions, cleanUser];
    }

    if (isSupabaseConfigured()) {
      await updateSupabaseChatMessageReactions(id, message.reactions).catch(() => {});
    }

    saveStore(store);
    broadcast('message_reaction', { messageId: id, reactions: message.reactions, emoji, username: cleanUser });
    res.json({ success: true, messageId: id, reactions: message.reactions });
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
    const t = store.transfers.find(item => item.id === id);

    if (t && t.downloadLimit && t.downloadsCount >= t.downloadLimit) {
      return res.status(403).json({ error: `This transfer has reached its maximum download limit of ${t.downloadLimit}.` });
    }

    let downloadsCount = (t?.downloadsCount || 0) + 1;

    if (isSupabaseConfigured()) {
      downloadsCount = await incrementSupabaseTransferDownload(id);
    }

    if (t) {
      t.downloadsCount = downloadsCount;
      saveStore(store);
    }
    broadcast('transfer_downloaded', { id, downloadsCount });
    res.json({ success: true, downloadsCount });
  });

  // Transfers - Toggle Favorite
  app.post('/api/transfers/:id/favorite', async (req, res) => {
    const { id } = req.params;
    const { username } = req.body;
    const t = store.transfers.find(item => item.id === id);
    if (!t) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    t.isFavorite = !t.isFavorite;
    saveStore(store);

    if (username) {
      const u = store.users.find(user => user.username.toLowerCase() === username.toLowerCase());
      if (u) {
        u.favoritePackageIds = u.favoritePackageIds || [];
        if (t.isFavorite) {
          if (!u.favoritePackageIds.includes(id)) u.favoritePackageIds.push(id);
        } else {
          u.favoritePackageIds = u.favoritePackageIds.filter(favId => favId !== id);
        }
        saveStore(store);
      }
    }

    broadcast('transfer_favorited', { id, isFavorite: t.isFavorite });
    res.json({ success: true, isFavorite: t.isFavorite });
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

  // Published Packages - Get All (with age restriction enforcement)
  app.get('/api/published', async (req, res) => {
    let allPublished: any[] = [];
    if (isSupabaseConfigured()) {
      const dbPublished = await getSupabasePublished();
      if (dbPublished.length > 0) {
        allPublished = dbPublished;
      }
    }
    if (allPublished.length === 0) {
      allPublished = store.publishedPackages || [];
    }

    const sessionUser = getCurrentSessionUser(req);
    const queryUsername = ((req.query.user as string) || '').replace(/^@/, '').toLowerCase().trim();
    let isRequesterAdult = sessionUser?.isAdult;
    if (isRequesterAdult === undefined && queryUsername) {
      const u = store.users.find(user => user.username.toLowerCase() === queryUsername);
      if (u) isRequesterAdult = u.isAdult;
    }

    // If requester is verified adult, return full vault; if minor or unverified guest, exclude 18+ mature content
    if (isRequesterAdult) {
      return res.json(allPublished);
    }

    const safePublished = allPublished.filter(p => !p.isMature);
    res.json(safePublished);
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

  // Published Packages - Edit / Update (with author verification)
  app.put('/api/published/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const idx = store.publishedPackages.findIndex(p => p.id === id);
    if (idx < 0) {
      return res.status(404).json({ error: 'Published package not found' });
    }

    const current = store.publishedPackages[idx];
    const sessionUser = getCurrentSessionUser(req);
    const requestedBy = (req.body?.authorUsername || req.query?.user || sessionUser?.username || '').toString().replace(/^@/, '').toLowerCase().trim();

    if (sessionUser && current.authorUsername?.toLowerCase() !== sessionUser.username.toLowerCase()) {
      return res.status(403).json({ error: 'You are not authorized to modify this publication' });
    } else if (!sessionUser && requestedBy && current.authorUsername?.toLowerCase() !== requestedBy) {
      return res.status(403).json({ error: 'You are not authorized to modify this publication' });
    }

    const updated = {
      ...current,
      ...updates,
      id: current.id,
      updatedAt: new Date().toISOString(),
    };

    store.publishedPackages[idx] = updated;

    if (isSupabaseConfigured()) {
      await upsertSupabasePublished(updated).catch(() => {});
    }

    saveStore(store);
    broadcast('published_updated', updated);
    res.json({ success: true, package: updated });
  });

  // Published Packages - Delete (with author verification)
  app.delete('/api/published/:id', async (req, res) => {
    const { id } = req.params;
    const pkg = store.publishedPackages.find(p => p.id === id);
    if (!pkg) {
      return res.status(404).json({ error: 'Published package not found' });
    }

    const sessionUser = getCurrentSessionUser(req);
    const requestedBy = (req.body?.authorUsername || req.query?.user || sessionUser?.username || '').toString().replace(/^@/, '').toLowerCase().trim();

    if (sessionUser && pkg.authorUsername?.toLowerCase() !== sessionUser.username.toLowerCase()) {
      return res.status(403).json({ error: 'You are not authorized to delete this publication' });
    } else if (!sessionUser && requestedBy && pkg.authorUsername?.toLowerCase() !== requestedBy) {
      return res.status(403).json({ error: 'You are not authorized to delete this publication' });
    }

    store.publishedPackages = store.publishedPackages.filter(p => p.id !== id);
    saveStore(store);

    broadcast('published_deleted', { id });
    res.json({ success: true, id });
  });

  // Published Packages - Report
  app.post('/api/published/:id/report', async (req, res) => {
    const { id } = req.params;
    const { reason, details, reportedBy } = req.body;

    const pkg = store.publishedPackages.find(p => p.id === id);
    if (!pkg) {
      return res.status(404).json({ error: 'Published package not found' });
    }

    const reporter = reportedBy || 'anonymous';
    pkg.reportedBy = pkg.reportedBy || [];
    if (!pkg.reportedBy.includes(reporter)) {
      pkg.reportedBy.push(reporter);
      pkg.reportsCount = (pkg.reportsCount || 0) + 1;
    }

    store.reports = store.reports || [];
    const newReport = {
      id: `rep-${Date.now()}`,
      packageId: id,
      reportedBy: reporter,
      reason: reason || 'inappropriate',
      details: details || '',
      createdAt: new Date().toISOString(),
    };
    store.reports.push(newReport);
    saveStore(store);

    broadcast('published_reported', { id, reportsCount: pkg.reportsCount });
    res.json({ success: true, report: newReport });
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

  // Published Packages - Download Counter (Enforcing downloadsEnabled)
  app.post('/api/published/:id/download', async (req, res) => {
    const { id } = req.params;
    const pkg = store.publishedPackages.find(p => p.id === id);

    if (pkg && pkg.downloadsEnabled === false) {
      return res.status(403).json({ error: 'Downloads have been disabled for this publication by the author.' });
    }

    let downloadsCount = 1;

    if (isSupabaseConfigured()) {
      downloadsCount = await incrementSupabasePublishedDownload(id);
    }

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
