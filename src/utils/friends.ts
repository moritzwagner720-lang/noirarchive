import { FriendRequest, ChatMessage, TransferFile } from '../types';

export function canSendFriendRequest(
  fromUsername: string,
  toUsername: string,
  currentFriends: string[],
  existingRequests: FriendRequest[]
): { allowed: boolean; error?: string } {
  const from = fromUsername.toLowerCase().trim();
  const to = toUsername.toLowerCase().trim();

  if (!to) {
    return { allowed: false, error: 'Recipient username is required.' };
  }

  if (from === to) {
    return { allowed: false, error: 'You cannot send a friend request to yourself.' };
  }

  if (currentFriends.map(f => f.toLowerCase()).includes(to)) {
    return { allowed: false, error: `@${to} is already in your friends list.` };
  }

  const alreadyPending = existingRequests.some(
    r =>
      r.status === 'pending' &&
      ((r.fromUsername.toLowerCase() === from && r.toUsername.toLowerCase() === to) ||
        (r.fromUsername.toLowerCase() === to && r.toUsername.toLowerCase() === from))
  );

  if (alreadyPending) {
    return { allowed: false, error: `A friend request between you and @${to} is already pending.` };
  }

  return { allowed: true };
}

export function createFriendRequest(fromUsername: string, toUsername: string): FriendRequest {
  return {
    id: `freq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    fromUsername: fromUsername.toLowerCase().trim(),
    toUsername: toUsername.toLowerCase().trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

export function createChatMessage(
  senderUsername: string,
  recipientUsername: string,
  text: string,
  attachment?: {
    type: 'file' | 'folder';
    title: string;
    files: TransferFile[];
    totalSize: string;
  },
  groupId?: string,
  replyTo?: { id: string; senderUsername: string; text: string }
): ChatMessage {
  if (!text.trim() && !attachment) {
    throw new Error('Message cannot be empty without an attachment.');
  }

  return {
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    senderUsername: senderUsername.toLowerCase().trim(),
    recipientUsername: recipientUsername.toLowerCase().trim(),
    text: text.trim(),
    attachment,
    groupId,
    replyTo,
    reactions: {},
    createdAt: new Date().toISOString(),
  };
}
