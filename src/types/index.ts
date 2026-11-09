export type AspectRatio = 'square' | 'portrait' | 'landscape' | 'panoramic';

export type PhotoCategory =
  | 'architecture'
  | 'portraiture'
  | 'street'
  | 'nature'
  | 'still-life'
  | 'editorial';

export type GridLayout = 'masonry' | 'grid-2' | 'grid-3' | 'contact-sheet';

export interface ExifData {
  camera?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
  year?: string;
  location?: string;
}

export interface Photo {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  caption: string;
  url: string;
  aspectRatio: AspectRatio;
  category: PhotoCategory;
  exif: ExifData;
  createdAt: string;
  featured?: boolean;
  fileSize?: string;
  dimensions?: string;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  coverPhotoUrl: string;
  layoutPreference: GridLayout;
  isPublic: boolean;
  category: PhotoCategory;
  createdAt: string;
  clientDeliveryNotes?: string;
  clientName?: string;
}

export type GroupPrivacySetting = 'everyone' | 'friends' | 'nobody';

export type ThemeId =
  | 'graphite'
  | 'midnight'
  | 'arctic'
  | 'purple'
  | 'emerald'
  | 'crimson'
  | 'rose'
  | 'ocean'
  | 'amber'
  | 'monochrome'
  | 'christmas'
  | 'halloween';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  type: 'standard' | 'seasonal';
  description: string;
  accentHex: string;
  accentHoverHex: string;
  accentText: string;
  bgBase: string;
  bgSurface: string;
  bgElevated: string;
  borderColor: string;
  previewColors: [string, string, string];
}

export interface FriendGroup {
  id: string;
  ownerUsername: string;
  name: string;
  memberUsernames: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface ActiveSession {
  id: string;
  client: string;
  ip: string;
  lastActive: string;
  current?: boolean;
  createdAt?: string;
}

export interface UserSettings {
  matureContentFilter?: 'show' | 'warn' | 'hide';
  publicVisibility?: 'everyone' | 'users' | 'friends';
  defaultExpiryDays?: number | null;
  defaultRequirePassword?: boolean;
  preferredDownloadMode?: 'zip' | 'individual';
  notificationSounds?: boolean;
  seasonalEffectsEnabled?: boolean;
  language?: string;
}

export interface User {
  id: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  customAvatar?: string; // User-uploaded custom profile picture
  location?: string;
  passwordHash: string;
  createdAt: string;
  friends: string[]; // array of usernames
  selectedTheme?: ThemeId;
  groupPrivacy?: GroupPrivacySetting;
  settings?: UserSettings;
  favoritePackageIds?: string[];
  activeSessions?: ActiveSession[];
}

export interface TransferFile {
  id: string;
  name: string;
  url: string;
  size: string;
  type: string;
  folderPath?: string;
}

export interface ClientReview {
  id: string;
  author: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface FileTransferPackage {
  id: string; // e.g. TR-7391
  senderId: string;
  senderUsername: string;
  title: string;
  note?: string;
  recipientType: 'username' | 'direct-link' | 'email' | 'group';
  recipientUsername?: string;
  recipientEmail?: string;
  recipientGroupId?: string;
  recipientGroupName?: string;
  hasPassword?: boolean;
  passwordHash?: string;
  downloadLimit?: number | null; // e.g. 5, 10, or null for unlimited
  expiresAt: string | null; // ISO string or null
  downloadsCount: number;
  files: TransferFile[];
  createdAt: string;
  status: 'active' | 'expired' | 'revoked';
  reviews?: ClientReview[];
  isFavorite?: boolean;
}

export interface FriendRequest {
  id: string;
  fromUsername: string;
  toUsername: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface ChatAttachment {
  type: 'file' | 'folder';
  title: string;
  files: TransferFile[];
  totalSize: string;
}

export interface ChatMessage {
  id: string;
  senderUsername: string;
  recipientUsername: string;
  text: string;
  attachment?: ChatAttachment;
  createdAt: string;
}

export interface PublishedPackage {
  id: string; // e.g. PUB-101
  title: string;
  description: string;
  authorUsername: string;
  authorAvatar?: string;
  category: PhotoCategory | 'all' | 'bundles';
  tags: string[];
  coverUrl?: string;
  files: TransferFile[];
  totalSize: string;
  downloadsCount: number;
  likesCount: number;
  likedBy?: string[];
  visibility?: 'public' | 'unlisted' | 'private';
  downloadsEnabled?: boolean;
  isMature?: boolean;
  matureReason?: string;
  reportsCount?: number;
  reportedBy?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface PublicationReport {
  id: string;
  packageId: string;
  reportedBy: string;
  reason: 'malware' | 'copyright' | 'inappropriate' | 'mature' | 'other';
  details?: string;
  createdAt: string;
}

export interface StorageStats {
  usedBytes: number;
  usedFormatted: string;
  totalTransfers: number;
  totalFiles: number;
  quotaBytes: number;
}

export interface NoirDesktopBridge {
  isDesktop: boolean;
  platform: string;
  version: string;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;
  openExternal: (url: string) => void;
  showItemInFolder: (fullPath: string) => void;
  getAppPaths: () => Promise<{ userData: string; appPath: string; version: string }>;
  getBackendUrl?: () => string;
  setBackendUrl?: (url: string) => void;
}

declare global {
  interface Window {
    noirDesktop?: NoirDesktopBridge;
    NOIR_API_URL?: string;
  }
}
