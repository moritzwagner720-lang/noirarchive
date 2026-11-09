import { FriendGroup, User, GroupPrivacySetting } from '../types';

/**
 * Checks whether a user permits another user to add them to a group
 * based on their group invitation privacy setting:
 * - 'everyone': Anyone can add them.
 * - 'friends': Only existing friends can add them.
 * - 'nobody': No one can add them.
 *
 * Supports both (targetUser, adderUsername) and (adderUsername, targetUser).
 */
export function canAddToGroup(
  first: User | { username: string; friends?: string[]; groupPrivacy?: GroupPrivacySetting } | string,
  second: User | { username: string; friends?: string[]; groupPrivacy?: GroupPrivacySetting } | string
): { allowed: boolean; error?: string } {
  let targetUser: { username: string; friends?: string[]; groupPrivacy?: GroupPrivacySetting };
  let adderUsername: string;

  if (typeof first === 'string') {
    adderUsername = first;
    targetUser = second as any;
  } else {
    targetUser = first as any;
    adderUsername = second as string;
  }

  if (!targetUser || !targetUser.username) {
    return { allowed: false, error: 'Target user does not exist.' };
  }

  const cleanAdder = (adderUsername || '').replace(/^@/, '').trim().toLowerCase();
  const cleanTarget = targetUser.username.replace(/^@/, '').trim().toLowerCase();

  // Owner adding themselves is always permitted
  if (cleanAdder === cleanTarget) {
    return { allowed: true };
  }

  const privacy: GroupPrivacySetting = targetUser.groupPrivacy || 'friends';

  if (privacy === 'nobody') {
    return {
      allowed: false,
      error: `@${targetUser.username} does not allow other users to add them to groups.`,
    };
  }

  if (privacy === 'friends') {
    const isFriend = (targetUser.friends || []).some(
      f => f.replace(/^@/, '').trim().toLowerCase() === cleanAdder
    );
    if (!isFriend) {
      return {
        allowed: false,
        error: `@${targetUser.username} only allows friends to add them to groups.`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Creates a new FriendGroup entity
 */
export function createFriendGroup(
  ownerUsername: string,
  name: string,
  initialMembers: string[] = []
): FriendGroup {
  const cleanName = (name || '').trim();
  if (!cleanName) {
    throw new Error('Group name is required and cannot be empty.');
  }

  const cleanOwner = (ownerUsername || '').replace(/^@/, '').trim().toLowerCase();
  const members = Array.from(
    new Set(initialMembers.map(m => m.replace(/^@/, '').trim().toLowerCase()))
  );

  return {
    id: `grp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ownerUsername: cleanOwner,
    name: cleanName,
    memberUsernames: members,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Adds a member to an existing group
 */
export function addMemberToGroup(group: FriendGroup, memberUsername: string): FriendGroup {
  const clean = memberUsername.replace(/^@/, '').trim().toLowerCase();
  if (!clean) return group;
  if (group.memberUsernames.map(m => m.toLowerCase()).includes(clean)) {
    return group;
  }

  return {
    ...group,
    memberUsernames: [...group.memberUsernames, clean],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Removes a member from an existing group
 */
export function removeMemberFromGroup(group: FriendGroup, memberUsername: string): FriendGroup {
  const clean = memberUsername.replace(/^@/, '').trim().toLowerCase();
  return {
    ...group,
    memberUsernames: group.memberUsernames.filter(m => m.toLowerCase() !== clean),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Renames an existing group
 */
export function renameFriendGroup(group: FriendGroup, newName: string): FriendGroup {
  const clean = newName.trim();
  if (!clean) {
    throw new Error('Group name cannot be empty (group name is required).');
  }
  return {
    ...group,
    name: clean,
    updatedAt: new Date().toISOString(),
  };
}
