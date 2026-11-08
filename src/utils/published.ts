import { PublishedPackage, TransferFile, PhotoCategory } from '../types';
import { calculateTotalTransferSize } from './transfer';

export interface CreatePublishedInput {
  title: string;
  description: string;
  authorUsername: string;
  authorAvatar?: string;
  category?: PhotoCategory | 'all' | 'bundles';
  tags?: string[];
  coverUrl?: string;
  files: TransferFile[];
}

export function createPublishedPackage(input: CreatePublishedInput): PublishedPackage {
  const cleanTitle = input.title.trim();
  if (!cleanTitle) {
    throw new Error('Title is required to publish files');
  }

  if (!input.files || input.files.length === 0) {
    throw new Error('At least one file is required to publish');
  }

  const id = `PUB-${Math.floor(1000 + Math.random() * 9000)}`;
  const totalSize = calculateTotalTransferSize(input.files);

  // If no cover photo provided, pick first image
  const coverUrl =
    input.coverUrl ||
    input.files.find(f => f.type.startsWith('image/'))?.url ||
    input.files[0]?.url ||
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=85';

  return {
    id,
    title: cleanTitle,
    description: input.description.trim() || 'Curated high-resolution file bundle open for public download.',
    authorUsername: input.authorUsername.trim() || 'creator',
    authorAvatar: input.authorAvatar,
    category: input.category || 'bundles',
    tags: input.tags && input.tags.length > 0 ? input.tags : ['photography', 'raw', 'free-download'],
    coverUrl,
    files: input.files,
    totalSize,
    downloadsCount: 0,
    likesCount: 0,
    likedBy: [],
    createdAt: new Date().toISOString(),
  };
}

export function filterPublishedPackages(
  packages: PublishedPackage[],
  query: string,
  category: string = 'all',
  sortBy: 'latest' | 'downloads' | 'likes' = 'latest'
): PublishedPackage[] {
  let result = [...packages];

  // Category filter
  if (category !== 'all') {
    result = result.filter(p => p.category === category);
  }

  // Search filter
  const q = query.trim().toLowerCase();
  if (q) {
    result = result.filter(
      p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.authorUsername.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        p.files.some(f => f.name.toLowerCase().includes(q))
    );
  }

  // Sort
  if (sortBy === 'downloads') {
    result.sort((a, b) => b.downloadsCount - a.downloadsCount);
  } else if (sortBy === 'likes') {
    result.sort((a, b) => b.likesCount - a.likesCount);
  } else {
    // latest
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return result;
}

export function togglePackageLike(
  pkg: PublishedPackage,
  username: string
): { updatedPackage: PublishedPackage; isLiked: boolean } {
  const currentLikedBy = pkg.likedBy || [];
  const hasLiked = currentLikedBy.some(u => u.toLowerCase() === username.toLowerCase());

  let nextLikedBy: string[];
  let nextCount: number;

  if (hasLiked) {
    nextLikedBy = currentLikedBy.filter(u => u.toLowerCase() !== username.toLowerCase());
    nextCount = Math.max(0, pkg.likesCount - 1);
  } else {
    nextLikedBy = [...currentLikedBy, username];
    nextCount = pkg.likesCount + 1;
  }

  return {
    updatedPackage: {
      ...pkg,
      likesCount: nextCount,
      likedBy: nextLikedBy,
    },
    isLiked: !hasLiked,
  };
}
