import { Photo, Project, User, FileTransferPackage, FriendRequest, ChatMessage, PublishedPackage } from '../types';
import { hashPassword } from '../utils/auth';
import { generateStandardAvatar } from '../utils/avatar';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-moritz',
    username: 'moritz',
    bio: 'Software engineer and file sharing enthusiast. Sending project archives and developer packages.',
    avatar: generateStandardAvatar('moritz'),
    location: 'Berlin',
    passwordHash: hashPassword('password123'),
    createdAt: '2024-01-15T10:00:00.000Z',
    friends: ['elena_k', 'kenji_mono'],
    selectedTheme: 'graphite',
    groupPrivacy: 'friends',
  },
  {
    id: 'user-elena',
    username: 'elena_k',
    bio: 'Product designer and multimedia collaborator. Sharing asset libraries and design folders.',
    avatar: generateStandardAvatar('elena_k'),
    location: 'Paris',
    passwordHash: hashPassword('secret456'),
    createdAt: '2024-02-01T12:00:00.000Z',
    friends: ['moritz'],
    selectedTheme: 'graphite',
    groupPrivacy: 'friends',
  },
  {
    id: 'user-kenji',
    username: 'kenji_mono',
    bio: 'System architect. Exchanging encrypted datasets and engineering build bundles.',
    avatar: generateStandardAvatar('kenji_mono'),
    location: 'Tokyo',
    passwordHash: hashPassword('mono789'),
    createdAt: '2024-03-10T09:30:00.000Z',
    friends: ['moritz'],
    selectedTheme: 'graphite',
    groupPrivacy: 'friends',
  },
  {
    id: 'user-daddy',
    username: 'daddy',
    bio: 'Verified member & archive curator.',
    avatar: generateStandardAvatar('daddy'),
    location: 'Berlin',
    passwordHash: hashPassword('password123'),
    createdAt: '2024-04-01T09:30:00.000Z',
    friends: [],
    selectedTheme: 'graphite',
    groupPrivacy: 'friends',
  },
];

export const INITIAL_PROJECTS: Project[] = [];
export const INITIAL_PHOTOS: Photo[] = [];
export const INITIAL_TRANSFERS: FileTransferPackage[] = [];
export const INITIAL_FRIEND_REQUESTS: FriendRequest[] = [];
export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [];
export const INITIAL_PUBLISHED_PACKAGES: PublishedPackage[] = [];
