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

export interface User {
  id: string;
  username: string;
  bio?: string;
  avatar: string;
  location?: string;
  passwordHash: string;
  createdAt: string;
  friends: string[]; // array of usernames
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
  recipientType: 'username' | 'direct-link' | 'email';
  recipientUsername?: string;
  recipientEmail?: string;
  hasPassword?: boolean;
  passwordHash?: string;
  expiresAt: string | null; // ISO string or null
  downloadsCount: number;
  files: TransferFile[];
  createdAt: string;
  status: 'active' | 'expired' | 'revoked';
  reviews?: ClientReview[];
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
  createdAt: string;
}
