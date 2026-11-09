import { FileTransferPackage, TransferFile } from '../types';
import { hashPassword, verifyPassword } from './auth';

export interface CreateTransferInput {
  senderId: string;
  senderUsername: string;
  senderName?: string;
  title: string;
  note?: string;
  recipientType: 'username' | 'direct-link' | 'email' | 'group';
  recipientUsername?: string;
  recipientEmail?: string;
  recipientGroupId?: string;
  recipientGroupName?: string;
  password?: string;
  expiryDays?: number | null; // e.g. 7, 30, null for never
  files: TransferFile[];
}

/**
 * Generate a short, elegant transfer reference ID like TR-8492
 */
export function generateTransferId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `TR-${num}`;
}

export function createTransferPackage(input: CreateTransferInput): FileTransferPackage {
  if (!input.title.trim()) {
    throw new Error('Transfer title is required');
  }
  if (!input.files || input.files.length === 0) {
    throw new Error('At least one file or photo must be included in the transfer');
  }

  const now = new Date();
  let expiresAt: string | null = null;
  if (input.expiryDays && input.expiryDays > 0) {
    const exp = new Date(now.getTime() + input.expiryDays * 24 * 60 * 60 * 1000);
    expiresAt = exp.toISOString();
  }

  const id = generateTransferId();

  return {
    id,
    senderId: input.senderId,
    senderUsername: input.senderUsername,
    title: input.title.trim(),
    note: input.note?.trim() || undefined,
    recipientType: input.recipientType,
    recipientUsername: input.recipientUsername?.trim().toLowerCase() || undefined,
    recipientEmail: input.recipientEmail?.trim() || undefined,
    recipientGroupId: input.recipientGroupId,
    recipientGroupName: input.recipientGroupName,
    hasPassword: Boolean(input.password && input.password.trim()),
    passwordHash: input.password && input.password.trim() ? hashPassword(input.password.trim()) : undefined,
    expiresAt,
    downloadsCount: 0,
    files: input.files,
    createdAt: now.toISOString(),
    status: 'active',
    reviews: [],
  };
}

export function isTransferExpired(pkg: FileTransferPackage): boolean {
  if (pkg.status === 'expired' || pkg.status === 'revoked') {
    return true;
  }
  if (!pkg.expiresAt) {
    return false;
  }
  return new Date(pkg.expiresAt).getTime() < Date.now();
}

export function verifyTransferAccess(
  pkg: FileTransferPackage,
  providedPassword?: string
): { canAccess: boolean; error?: string } {
  if (isTransferExpired(pkg)) {
    return { canAccess: false, error: 'This transfer link has expired or been revoked.' };
  }

  if (pkg.hasPassword) {
    if (!providedPassword) {
      return { canAccess: false, error: 'Password required to unlock this transfer package.' };
    }
    if (!pkg.passwordHash || !verifyPassword(providedPassword, pkg.passwordHash)) {
      return { canAccess: false, error: 'Incorrect transfer password.' };
    }
  }

  return { canAccess: true };
}

export function parseFileSizeBytes(sizeStr: string): number {
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

export function formatBytes(bytes: number): string {
  if (bytes <= 0 || isNaN(bytes)) return '0 B';
  const k = 1024;
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, units.length - 1);
  const val = bytes / Math.pow(k, idx);
  return `${val.toFixed(val >= 100 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

export function calculateTotalTransferSize(files: TransferFile[]): string {
  let totalBytes = 0;
  for (const f of files) {
    if (f.sizeBytes && f.sizeBytes > 0) {
      totalBytes += f.sizeBytes;
    } else {
      const s = f.size ? f.size.toLowerCase() : '';
      if (s.endsWith('mb')) {
        totalBytes += parseFloat(s) * 1024 * 1024;
      } else if (s.endsWith('kb')) {
        totalBytes += parseFloat(s) * 1024;
      } else if (s.endsWith('gb')) {
        totalBytes += parseFloat(s) * 1024 * 1024 * 1024;
      } else {
        totalBytes += parseFileSizeBytes(s) || 1024 * 500;
      }
    }
  }

  if (totalBytes >= 1024 * 1024 * 1024) {
    return `${(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  if (totalBytes >= 1024 * 1024) {
    return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.round(totalBytes / 1024)} KB`;
}

export function calculateUserTotalStorageStats(
  username: string,
  transfers: FileTransferPackage[],
  publishedPackages: any[] = []
): {
  totalBytes: number;
  totalFormatted: string;
  totalFiles: number;
  totalTransfers: number;
  userTransfers: FileTransferPackage[];
} {
  const clean = username.replace(/^@/, '').toLowerCase().trim();
  const userTransfers = transfers.filter(
    t => (t.senderUsername && t.senderUsername.toLowerCase() === clean) || (t.senderId && t.senderId.includes(clean))
  );

  let totalBytes = 0;
  let totalFiles = 0;

  for (const t of userTransfers) {
    for (const f of t.files || []) {
      totalFiles++;
      if (f.sizeBytes && f.sizeBytes > 0) {
        totalBytes += f.sizeBytes;
      } else {
        totalBytes += parseFileSizeBytes(f.size);
      }
    }
  }

  // Also include files in community shared vault packages authored by user
  const userPublished = publishedPackages.filter(
    p => (p.authorUsername && p.authorUsername.toLowerCase() === clean) || (p.photographer && p.photographer.toLowerCase() === clean)
  );

  for (const p of userPublished) {
    for (const f of p.files || p.images || []) {
      totalFiles++;
      if (f.sizeBytes && f.sizeBytes > 0) {
        totalBytes += f.sizeBytes;
      } else {
        totalBytes += parseFileSizeBytes(f.size);
      }
    }
  }

  return {
    totalBytes,
    totalFormatted: formatBytes(totalBytes),
    totalFiles,
    totalTransfers: userTransfers.length,
    userTransfers,
  };
}
