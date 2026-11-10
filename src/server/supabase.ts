/**
 * Supabase Database Client & Data Access Layer for Noir Archive
 * Project reference: dvhnfngbwebpsygxyiul
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const SUPABASE_PROJECT_REF = 'dvhnfngbwebpsygxyiul';
export const DEFAULT_SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;

const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';

let client: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  try {
    client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log(`[Supabase] Initialized client for project ${SUPABASE_PROJECT_REF} (${supabaseUrl})`);
  } catch (err) {
    console.error('[Supabase] Failed to initialize client:', err);
  }
} else {
  console.warn(
    `[Supabase] Service role key not configured. Running in fallback mode. Set SUPABASE_SERVICE_ROLE_KEY in .env to enable direct cloud persistence.`
  );
}

export function isSupabaseConfigured(): boolean {
  return !!client && !!supabaseKey;
}

export function getSupabaseClient(): SupabaseClient | null {
  return client;
}

function calculateAge(dobString?: string): number {
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

// Database Entities mapping
export interface DbUser {
  id: string;
  username: string;
  bio?: string;
  avatar: string;
  custom_avatar?: string;
  location?: string;
  password_hash: string;
  friends: string[];
  created_at: string;
  updated_at?: string;
  date_of_birth?: string;
  oauth_id?: string;
  oauth_provider?: string;
}

export interface UserDTO {
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
  dateOfBirth?: string;
  isAdult?: boolean;
  oauthId?: string;
  oauthProvider?: string;
}

export interface AuthSessionDTO {
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

export interface PublishedReportDTO {
  id: string;
  packageId: string;
  reportedBy: string;
  reason: string;
  details?: string;
  createdAt: string;
}

export interface FriendGroupDTO {
  id: string;
  ownerUsername: string;
  name: string;
  memberUsernames: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface FriendRequestDTO {
  id: string;
  fromUsername: string;
  toUsername: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: string;
}

export interface ChatMessageDTO {
  id: string;
  senderUsername: string;
  recipientUsername: string;
  text: string;
  attachment?: any;
  groupId?: string;
  replyTo?: { id: string; senderUsername: string; text: string };
  reactions?: Record<string, string[]>;
  createdAt: string;
}

function mapUserFromDb(row: any): UserDTO {
  const customAvatar = row.custom_avatar || (row.avatar && !row.avatar.includes('unsplash.com') ? row.avatar : undefined);
  const dob = row.date_of_birth || undefined;
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name || row.username,
    bio: row.bio || '',
    avatar: row.avatar || '',
    customAvatar,
    location: row.location || '',
    passwordHash: row.password_hash || '',
    createdAt: row.created_at || new Date().toISOString(),
    friends: Array.isArray(row.friends) ? row.friends : [],
    selectedTheme: row.selected_theme || 'graphite',
    groupPrivacy: (row.group_privacy as any) || 'friends',
    settings: row.settings && typeof row.settings === 'object' ? row.settings : {},
    favoritePackageIds: Array.isArray(row.favorite_package_ids) ? row.favorite_package_ids : [],
    dateOfBirth: dob,
    isAdult: dob ? calculateAge(dob) >= 18 : true,
    oauthId: row.oauth_id || undefined,
    oauthProvider: row.oauth_provider || undefined,
  };
}

function mapFriendRequestFromDb(row: any): FriendRequestDTO {
  return {
    id: row.id,
    fromUsername: row.from_username,
    toUsername: row.to_username,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapChatMessageFromDb(row: any): ChatMessageDTO {
  const groupId = row.group_id || (row.recipient_username?.startsWith('group:') ? row.recipient_username.replace('group:', '') : undefined);
  return {
    id: row.id,
    senderUsername: row.sender_username,
    recipientUsername: row.recipient_username,
    text: row.text || '',
    attachment: row.attachment || undefined,
    groupId,
    replyTo: row.reply_to || undefined,
    reactions: row.reactions || {},
    createdAt: row.created_at,
  };
}

// Supabase Test Connection
export async function testSupabaseConnection(): Promise<{ connected: boolean; message?: string }> {
  if (!client) {
    return { connected: false, message: 'SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.' };
  }
  try {
    const { data, error } = await client.from('users').select('username').limit(1);
    if (error) {
      return { connected: false, message: error.message };
    }
    return { connected: true, message: `Connected to Supabase PostgreSQL database (${data?.length ?? 0} sample rows fetched).` };
  } catch (err: any) {
    return { connected: false, message: err?.message || 'Connection failed' };
  }
}

// User Queries
export async function getSupabaseUsers(): Promise<UserDTO[]> {
  if (!client) return [];
  const { data, error } = await client.from('users').select('*').order('created_at', { ascending: true });
  if (error) {
    console.error('[Supabase] Error fetching users:', error.message);
    return [];
  }
  return (data || []).map(mapUserFromDb);
}

export async function getSupabaseUserByUsername(username: string): Promise<UserDTO | null> {
  if (!client) return null;
  const clean = username.replace(/^@/, '').trim().toLowerCase();
  const { data, error } = await client
    .from('users')
    .select('*')
    .ilike('username', clean)
    .maybeSingle();

  if (error) {
    console.error('[Supabase] Error fetching user by username:', error.message);
    return null;
  }
  return data ? mapUserFromDb(data) : null;
}

export async function searchSupabaseUsers(query: string): Promise<UserDTO[]> {
  if (!client) return [];
  const q = query.replace(/^@/, '').trim().toLowerCase();
  if (!q) {
    return getSupabaseUsers();
  }

  const { data, error } = await client
    .from('users')
    .select('*')
    .or(`username.ilike.%${q}%,bio.ilike.%${q}%,location.ilike.%${q}%`)
    .limit(50);

  if (error) {
    console.error('[Supabase] Error searching users:', error.message);
    return [];
  }
  return (data || []).map(mapUserFromDb);
}

export async function getSupabaseUserByOAuth(oauthId: string): Promise<UserDTO | null> {
  if (!client) return null;
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('oauth_id', oauthId)
    .maybeSingle();

  if (error || !data) return null;
  return mapUserFromDb(data);
}

export async function createSupabaseUser(user: UserDTO): Promise<UserDTO> {
  if (!client) return user;
  const dbPayload: any = {
    id: user.id,
    username: user.username.toLowerCase().trim(),
    bio: user.bio || '',
    avatar: user.avatar || '',
    location: user.location || '',
    password_hash: user.passwordHash,
    friends: user.friends || [],
    created_at: user.createdAt,
    updated_at: new Date().toISOString(),
  };

  if (user.customAvatar) dbPayload.custom_avatar = user.customAvatar;
  if (user.dateOfBirth) dbPayload.date_of_birth = user.dateOfBirth;
  if (user.oauthId) dbPayload.oauth_id = user.oauthId;
  if (user.oauthProvider) dbPayload.oauth_provider = user.oauthProvider;
  if (user.selectedTheme) dbPayload.selected_theme = user.selectedTheme;
  if (user.groupPrivacy) dbPayload.group_privacy = user.groupPrivacy;
  if (user.displayName) dbPayload.display_name = user.displayName;
  if (user.settings) dbPayload.settings = user.settings;
  if (Array.isArray(user.favoritePackageIds)) dbPayload.favorite_package_ids = user.favoritePackageIds;

  let { data, error } = await client
    .from('users')
    .insert(dbPayload)
    .select('*')
    .single();

  if (error && /column .* does not exist/i.test(error.message)) {
    delete dbPayload.display_name;
    delete dbPayload.settings;
    delete dbPayload.favorite_package_ids;
    const retry = await client.from('users').insert(dbPayload).select('*').single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error('[Supabase] Error creating user:', error.message);
    throw new Error(error.message);
  }
  return mapUserFromDb(data);
}

export async function updateSupabaseUserAvatar(username: string, avatar: string): Promise<UserDTO | null> {
  if (!client) return null;
  const clean = username.toLowerCase().trim();
  const { data, error } = await client
    .from('users')
    .update({ avatar, custom_avatar: avatar, updated_at: new Date().toISOString() })
    .ilike('username', clean)
    .select('*')
    .single();

  if (error) {
    console.error('[Supabase] Error updating avatar:', error.message);
    return null;
  }
  return mapUserFromDb(data);
}

export async function updateSupabaseUserFriends(username: string, friends: string[]): Promise<void> {
  if (!client) return;
  const clean = username.toLowerCase().trim();
  const { error } = await client
    .from('users')
    .update({ friends, updated_at: new Date().toISOString() })
    .ilike('username', clean);

  if (error) {
    console.error('[Supabase] Error updating friends:', error.message);
  }
}

export async function removeSupabaseFriendship(user1: string, user2: string): Promise<void> {
  if (!client) return;
  const u1 = user1.toLowerCase().trim();
  const u2 = user2.toLowerCase().trim();
  try {
    const user1Data = await getSupabaseUserByUsername(u1);
    if (user1Data) {
      const nextFriends = user1Data.friends.filter(f => f.toLowerCase().trim() !== u2);
      await updateSupabaseUserFriends(u1, nextFriends);
    }
    const user2Data = await getSupabaseUserByUsername(u2);
    if (user2Data) {
      const nextFriends = user2Data.friends.filter(f => f.toLowerCase().trim() !== u1);
      await updateSupabaseUserFriends(u2, nextFriends);
    }
  } catch (err) {
    console.warn('[Supabase] Error removing friendship:', err);
  }
}

export async function updateSupabaseUserSettings(
  username: string,
  settings: {
    selectedTheme?: string;
    groupPrivacy?: string;
    bio?: string;
    location?: string;
    displayName?: string;
    customAvatar?: string | null;
    dateOfBirth?: string;
    settings?: any;
    favoritePackageIds?: string[];
  }
): Promise<UserDTO | null> {
  if (!client) return null;
  const clean = username.toLowerCase().trim();
  const updatePayload: any = { updated_at: new Date().toISOString() };
  if (settings.selectedTheme) updatePayload.selected_theme = settings.selectedTheme;
  if (settings.groupPrivacy) updatePayload.group_privacy = settings.groupPrivacy;
  if (settings.bio !== undefined) updatePayload.bio = settings.bio;
  if (settings.location !== undefined) updatePayload.location = settings.location;
  if (settings.customAvatar !== undefined) {
    updatePayload.custom_avatar = settings.customAvatar || null;
    updatePayload.avatar = settings.customAvatar || '';
  }
  if (settings.dateOfBirth !== undefined) updatePayload.date_of_birth = settings.dateOfBirth;
  if (settings.displayName !== undefined) updatePayload.display_name = settings.displayName;
  if (settings.settings !== undefined) {
    // Merge with existing settings in DB so partial updates don't wipe other keys
    const { data: existingRow } = await client
      .from('users')
      .select('settings')
      .ilike('username', clean)
      .maybeSingle();
    const existingSettings =
      existingRow?.settings && typeof existingRow.settings === 'object' ? existingRow.settings : {};
    updatePayload.settings = { ...existingSettings, ...settings.settings };
  }
  if (Array.isArray(settings.favoritePackageIds)) {
    updatePayload.favorite_package_ids = settings.favoritePackageIds;
  }

  let { data, error } = await client
    .from('users')
    .update(updatePayload)
    .ilike('username', clean)
    .select('*')
    .maybeSingle();

  if (error && /column .* does not exist/i.test(error.message)) {
    console.warn('[Supabase] Missing user columns (run migration 20261110000000_persistence_fixes.sql):', error.message);
    delete updatePayload.display_name;
    delete updatePayload.settings;
    delete updatePayload.favorite_package_ids;
    const retry = await client
      .from('users')
      .update(updatePayload)
      .ilike('username', clean)
      .select('*')
      .maybeSingle();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error('[Supabase] Error updating user settings:', error.message);
    return null;
  }
  return data ? mapUserFromDb(data) : null;
}

export async function updateSupabaseUserPassword(username: string, passwordHash: string): Promise<boolean> {
  if (!client) return false;
  const clean = username.toLowerCase().trim();
  const { error } = await client
    .from('users')
    .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
    .ilike('username', clean);

  if (error) {
    console.error('[Supabase] Error updating user password:', error.message);
    return false;
  }
  return true;
}

export async function deleteSupabasePublished(id: string): Promise<boolean> {
  if (!client) return true;
  try {
    const { error } = await client.from('published_packages').delete().eq('id', id);
    if (error) {
      console.warn('[Supabase] Error deleting published package:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Friend Groups
function mapFriendGroupFromDb(row: any): FriendGroupDTO {
  return {
    id: row.id,
    ownerUsername: row.owner_username,
    name: row.name,
    memberUsernames: Array.isArray(row.member_usernames) ? row.member_usernames : [],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export async function getSupabaseGroups(usernameFilter?: string): Promise<FriendGroupDTO[]> {
  if (!client) return [];
  try {
    let query = client.from('friend_groups').select('*').order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) {
      console.warn('[Supabase] friend_groups table query info:', error.message);
      return [];
    }
    const all = (data || []).map(mapFriendGroupFromDb);
    if (usernameFilter) {
      const clean = usernameFilter.replace(/^@/, '').toLowerCase().trim();
      return all.filter(
        g =>
          g.ownerUsername.toLowerCase() === clean ||
          g.memberUsernames.map(m => m.toLowerCase()).includes(clean)
      );
    }
    return all;
  } catch (err: any) {
    console.warn('[Supabase] Groups query fallback:', err?.message);
    return [];
  }
}

export async function createSupabaseGroup(group: FriendGroupDTO): Promise<FriendGroupDTO> {
  if (!client) return group;
  try {
    const payload = {
      id: group.id,
      owner_username: group.ownerUsername.toLowerCase().trim(),
      name: group.name.trim(),
      member_usernames: group.memberUsernames.map(m => m.toLowerCase().trim()),
      created_at: group.createdAt,
      updated_at: group.updatedAt || new Date().toISOString(),
    };
    const { data, error } = await client.from('friend_groups').insert(payload).select('*').single();
    if (error) {
      console.warn('[Supabase] Error creating friend group in cloud DB:', error.message);
      return group;
    }
    return mapFriendGroupFromDb(data);
  } catch {
    return group;
  }
}

export async function updateSupabaseGroup(group: FriendGroupDTO): Promise<void> {
  if (!client) return;
  try {
    const payload = {
      name: group.name.trim(),
      member_usernames: group.memberUsernames.map(m => m.toLowerCase().trim()),
      updated_at: new Date().toISOString(),
    };
    const { error } = await client.from('friend_groups').update(payload).eq('id', group.id);
    if (error) {
      console.warn('[Supabase] Error updating friend group:', error.message);
    }
  } catch {}
}

export async function deleteSupabaseGroup(id: string): Promise<void> {
  if (!client) return;
  try {
    const { error } = await client.from('friend_groups').delete().eq('id', id);
    if (error) {
      console.warn('[Supabase] Error deleting friend group:', error.message);
    }
  } catch {}
}

// Friend Requests
export async function getSupabaseFriendRequests(usernameFilter?: string): Promise<FriendRequestDTO[]> {
  if (!client) return [];
  let query = client.from('friend_requests').select('*').order('created_at', { ascending: false });

  if (usernameFilter) {
    const clean = usernameFilter.replace(/^@/, '').toLowerCase().trim();
    query = query.or(`from_username.ilike.${clean},to_username.ilike.${clean}`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[Supabase] Error fetching friend requests:', error.message);
    return [];
  }
  return (data || []).map(mapFriendRequestFromDb);
}

export async function createSupabaseFriendRequest(req: FriendRequestDTO): Promise<FriendRequestDTO> {
  if (!client) return req;
  const payload = {
    id: req.id,
    from_username: req.fromUsername.toLowerCase().trim(),
    to_username: req.toUsername.toLowerCase().trim(),
    status: req.status,
    created_at: req.createdAt,
  };

  const { data, error } = await client
    .from('friend_requests')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    console.error('[Supabase] Error creating friend request:', error.message);
    throw new Error(error.message);
  }
  return mapFriendRequestFromDb(data);
}

export async function getSupabaseFriendRequestById(id: string): Promise<FriendRequestDTO | null> {
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('friend_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return mapFriendRequestFromDb(data);
  } catch {
    return null;
  }
}

export async function updateSupabaseFriendRequestStatus(id: string, status: string): Promise<void> {
  if (!client) return;
  const { error } = await client
    .from('friend_requests')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('[Supabase] Error updating friend request status:', error.message);
  }
}

export async function deleteSupabaseFriendRequest(id: string): Promise<void> {
  if (!client) return;
  const { error } = await client
    .from('friend_requests')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase] Error deleting friend request:', error.message);
  }
}

// Chat Messages
export async function getSupabaseChatMessages(user1?: string, user2?: string, groupId?: string): Promise<ChatMessageDTO[]> {
  if (!client) return [];
  let query = client.from('chat_messages').select('*').order('created_at', { ascending: true });

  if (groupId) {
    const cleanGroup = groupId.replace(/^group:/, '').trim();
    query = query.or(`group_id.eq.${cleanGroup},recipient_username.eq.group:${cleanGroup}`);
  } else if (user1 && user2) {
    const u1 = user1.replace(/^@/, '').toLowerCase().trim();
    const u2 = user2.replace(/^@/, '').toLowerCase().trim();
    query = query.or(
      `and(sender_username.ilike.${u1},recipient_username.ilike.${u2}),and(sender_username.ilike.${u2},recipient_username.ilike.${u1})`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error('[Supabase] Error fetching chat messages:', error.message);
    return [];
  }
  return (data || []).map(mapChatMessageFromDb);
}

export async function createSupabaseChatMessage(msg: ChatMessageDTO): Promise<ChatMessageDTO> {
  if (!client) return msg;
  const payload: any = {
    id: msg.id,
    sender_username: msg.senderUsername.toLowerCase().trim(),
    recipient_username: msg.recipientUsername.toLowerCase().trim(),
    text: msg.text || '',
    attachment: msg.attachment || null,
    created_at: msg.createdAt,
  };

  if (msg.groupId) payload.group_id = msg.groupId;
  if (msg.replyTo) payload.reply_to = msg.replyTo;
  if (msg.reactions) payload.reactions = msg.reactions;

  const { data, error } = await client
    .from('chat_messages')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    console.error('[Supabase] Error saving chat message:', error.message);
    throw new Error(error.message);
  }
  return mapChatMessageFromDb(data);
}

export async function updateSupabaseChatMessageReactions(
  messageId: string,
  reactions: Record<string, string[]>
): Promise<void> {
  if (!client) return;
  try {
    const { error } = await client
      .from('chat_messages')
      .update({ reactions })
      .eq('id', messageId);
    if (error) {
      console.warn('[Supabase] Error updating message reactions:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase] Error updating reactions:', err);
  }
}

// Transfers
export async function getSupabaseTransfers(): Promise<any[]> {
  if (!client) return [];
  const { data, error } = await client.from('transfers').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('[Supabase] Error fetching transfers:', error.message);
    return [];
  }
  return (data || []).map(row => ({
    id: row.id,
    title: row.title,
    senderUsername: row.sender_username,
    recipientEmail: row.recipient_email,
    recipientUsername: row.recipient_username,
    files: row.files,
    totalSize: row.total_size,
    expiresAt: row.expires_at,
    status: row.status,
    downloadsCount: row.downloads_count,
    reviews: row.reviews,
    createdAt: row.created_at,
  }));
}

export async function upsertSupabaseTransfer(transfer: any): Promise<void> {
  if (!client) return;
  const payload = {
    id: transfer.id,
    title: transfer.title || 'Untitled Transfer',
    sender_username: transfer.senderUsername || 'anonymous',
    recipient_email: transfer.recipientEmail || '',
    recipient_username: transfer.recipientUsername || '',
    files: transfer.files || [],
    total_size: transfer.totalSize || '0 B',
    expires_at: transfer.expiresAt || null,
    status: transfer.status || 'active',
    downloads_count: transfer.downloadsCount || 0,
    reviews: transfer.reviews || [],
    created_at: transfer.createdAt || new Date().toISOString(),
  };

  const { error } = await client.from('transfers').upsert(payload, { onConflict: 'id' });
  if (error) {
    console.error('[Supabase] Error upserting transfer:', error.message);
  }
}

export async function incrementSupabaseTransferDownload(id: string): Promise<number> {
  if (!client) return 1;
  const { data } = await client.from('transfers').select('downloads_count').eq('id', id).maybeSingle();
  const newCount = (data?.downloads_count || 0) + 1;
  await client.from('transfers').update({ downloads_count: newCount }).eq('id', id);
  return newCount;
}

export async function revokeSupabaseTransfer(id: string): Promise<void> {
  if (!client) return;
  await client.from('transfers').update({ status: 'revoked' }).eq('id', id);
}

export async function addSupabaseTransferReview(id: string, review: any): Promise<void> {
  if (!client) return;
  const { data } = await client.from('transfers').select('reviews').eq('id', id).maybeSingle();
  const currentReviews = data?.reviews || [];
  const updatedReviews = [review, ...currentReviews];
  await client.from('transfers').update({ reviews: updatedReviews }).eq('id', id);
}

// Published Packages
export async function getSupabasePublished(): Promise<any[]> {
  if (!client) return [];
  const { data, error } = await client.from('published_packages').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('[Supabase] Error fetching published packages:', error.message);
    return [];
  }
  return (data || []).map(row => {
    const files = Array.isArray(row.images) ? row.images : [];
    return {
      id: row.id,
      title: row.title,
      authorUsername: row.photographer,
      authorAvatar: row.avatar,
      coverUrl: row.cover_image,
      files,
      description: row.description,
      tags: Array.isArray(row.tags) ? row.tags : [],
      category: row.category || 'other',
      isMature: Boolean(row.is_mature),
      downloadsEnabled: row.downloads_enabled !== undefined ? Boolean(row.downloads_enabled) : true,
      reportedBy: Array.isArray(row.reported_by) ? row.reported_by : [],
      reportsCount: typeof row.reports_count === 'number' ? row.reports_count : 0,
      fileCount: typeof row.file_count === 'number' && row.file_count > 0 ? row.file_count : files.length,
      totalSize: row.total_size || '0 B',
      downloadsCount: row.downloads_count || 0,
      likesCount: row.likes_count || 0,
      likedBy: Array.isArray(row.liked_by) ? row.liked_by : [],
      createdAt: row.created_at,
    };
  });
}

export async function upsertSupabasePublished(pkg: any): Promise<void> {
  if (!client) return;
  const files = pkg.files || pkg.images || [];
  const payload: any = {
    id: pkg.id,
    title: pkg.title,
    photographer: pkg.authorUsername || pkg.photographer || 'anonymous',
    avatar: pkg.authorAvatar || pkg.avatar || '',
    cover_image: pkg.coverUrl || pkg.coverImage || '',
    images: files,
    description: pkg.description || '',
    tags: pkg.tags || [],
    category: pkg.category || 'other',
    is_mature: Boolean(pkg.isMature),
    downloads_enabled: pkg.downloadsEnabled !== false,
    reported_by: Array.isArray(pkg.reportedBy) ? pkg.reportedBy : [],
    reports_count: typeof pkg.reportsCount === 'number' ? pkg.reportsCount : 0,
    file_count: typeof pkg.fileCount === 'number' ? pkg.fileCount : files.length,
    total_size: pkg.totalSize || '0 B',
    downloads_count: pkg.downloadsCount || 0,
    likes_count: pkg.likesCount || 0,
    liked_by: pkg.likedBy || [],
    created_at: pkg.createdAt || new Date().toISOString(),
  };

  let { error } = await client.from('published_packages').upsert(payload, { onConflict: 'id' });
  if (error && /column .* does not exist/i.test(error.message)) {
    console.warn('[Supabase] Missing published_packages columns (run migration 20261110000000_persistence_fixes.sql):', error.message);
    delete payload.category;
    delete payload.is_mature;
    delete payload.downloads_enabled;
    delete payload.reported_by;
    delete payload.reports_count;
    delete payload.file_count;
    delete payload.total_size;
    const retry = await client.from('published_packages').upsert(payload, { onConflict: 'id' });
    error = retry.error;
  }
  if (error) {
    console.error('[Supabase] Error upserting published package:', error.message);
  }
}

export async function updateSupabasePublishedLike(id: string, username: string): Promise<{ likesCount: number; likedBy: string[] }> {
  if (!client) return { likesCount: 0, likedBy: [] };
  const { data } = await client.from('published_packages').select('likes_count, liked_by').eq('id', id).maybeSingle();
  let likedBy: string[] = data?.liked_by || [];
  let likesCount: number = data?.likes_count || 0;

  if (likedBy.includes(username)) {
    likedBy = likedBy.filter(u => u !== username);
    likesCount = Math.max(0, likesCount - 1);
  } else {
    likedBy.push(username);
    likesCount += 1;
  }

  await client.from('published_packages').update({ likes_count: likesCount, liked_by: likedBy }).eq('id', id);
  return { likesCount, likedBy };
}

export async function incrementSupabasePublishedDownload(id: string): Promise<number> {
  if (!client) return 1;
  const { data } = await client.from('published_packages').select('downloads_count').eq('id', id).maybeSingle();
  const newCount = (data?.downloads_count || 0) + 1;
  await client.from('published_packages').update({ downloads_count: newCount }).eq('id', id);
  return newCount;
}

// Auth Sessions
function mapSessionFromDb(row: any): AuthSessionDTO {
  return {
    id: row.id,
    token: row.token,
    userId: row.user_id,
    username: row.username,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    lastActive: row.last_active,
    client: row.client || 'Web Browser',
    ip: row.ip || '127.0.0.1',
  };
}

export async function getSupabaseSessionByToken(token: string): Promise<AuthSessionDTO | null> {
  if (!client || !token) return null;
  const { data, error } = await client.from('auth_sessions').select('*').eq('token', token).maybeSingle();
  if (error) {
    if (!/relation .* does not exist/i.test(error.message)) {
      console.warn('[Supabase] Error fetching session:', error.message);
    }
    return null;
  }
  return data ? mapSessionFromDb(data) : null;
}

export async function getSupabaseSessionsByUsername(username: string): Promise<AuthSessionDTO[]> {
  if (!client) return [];
  const clean = username.toLowerCase().trim();
  const { data, error } = await client
    .from('auth_sessions')
    .select('*')
    .ilike('username', clean)
    .order('last_active', { ascending: false });
  if (error) {
    if (!/relation .* does not exist/i.test(error.message)) {
      console.warn('[Supabase] Error fetching user sessions:', error.message);
    }
    return [];
  }
  return (data || []).map(mapSessionFromDb);
}

export async function createSupabaseSession(session: AuthSessionDTO): Promise<void> {
  if (!client) return;
  const { error } = await client.from('auth_sessions').upsert(
    {
      id: session.id,
      token: session.token,
      user_id: session.userId,
      username: session.username.toLowerCase().trim(),
      created_at: session.createdAt,
      expires_at: session.expiresAt,
      last_active: session.lastActive,
      client: session.client || 'Web Browser',
      ip: session.ip || '127.0.0.1',
    },
    { onConflict: 'id' }
  );
  if (error && !/relation .* does not exist/i.test(error.message)) {
    console.warn('[Supabase] Error creating session:', error.message);
  }
}

export async function touchSupabaseSession(token: string, lastActive: string): Promise<void> {
  if (!client || !token) return;
  const { error } = await client.from('auth_sessions').update({ last_active: lastActive }).eq('token', token);
  if (error && !/relation .* does not exist/i.test(error.message)) {
    console.warn('[Supabase] Error touching session:', error.message);
  }
}

export async function deleteSupabaseSessionByToken(token: string): Promise<void> {
  if (!client || !token) return;
  const { error } = await client.from('auth_sessions').delete().eq('token', token);
  if (error && !/relation .* does not exist/i.test(error.message)) {
    console.warn('[Supabase] Error deleting session:', error.message);
  }
}

export async function deleteSupabaseSessionById(id: string, username: string): Promise<boolean> {
  if (!client) return false;
  const { error } = await client
    .from('auth_sessions')
    .delete()
    .eq('id', id)
    .ilike('username', username.toLowerCase().trim());
  if (error) {
    if (!/relation .* does not exist/i.test(error.message)) {
      console.warn('[Supabase] Error deleting session by ID:', error.message);
    }
    return false;
  }
  return true;
}

export async function deleteAllSupabaseSessionsForUser(username: string): Promise<void> {
  if (!client) return;
  const { error } = await client
    .from('auth_sessions')
    .delete()
    .ilike('username', username.toLowerCase().trim());
  if (error && !/relation .* does not exist/i.test(error.message)) {
    console.warn('[Supabase] Error deleting all user sessions:', error.message);
  }
}

// Published Reports
export async function createSupabaseReport(report: PublishedReportDTO): Promise<void> {
  if (!client) return;
  const { error } = await client.from('published_reports').upsert(
    {
      id: report.id,
      package_id: report.packageId,
      reported_by: report.reportedBy,
      reason: report.reason || 'inappropriate',
      details: report.details || '',
      created_at: report.createdAt,
    },
    { onConflict: 'id' }
  );
  if (error && !/relation .* does not exist/i.test(error.message)) {
    console.warn('[Supabase] Error creating report:', error.message);
  }
}

export async function getSupabaseReports(packageId?: string): Promise<PublishedReportDTO[]> {
  if (!client) return [];
  let q = client.from('published_reports').select('*').order('created_at', { ascending: false });
  if (packageId) q = q.eq('package_id', packageId);
  const { data, error } = await q;
  if (error) {
    if (!/relation .* does not exist/i.test(error.message)) {
      console.warn('[Supabase] Error fetching reports:', error.message);
    }
    return [];
  }
  return (data || []).map(row => ({
    id: row.id,
    packageId: row.package_id,
    reportedBy: row.reported_by,
    reason: row.reason,
    details: row.details || '',
    createdAt: row.created_at,
  }));
}

// Preserve existing data: Sync from local storage into Supabase without deleting existing records
export async function syncLocalStorageToSupabase(localData: {
  users?: UserDTO[];
  friendRequests?: FriendRequestDTO[];
  chatMessages?: ChatMessageDTO[];
  transfers?: any[];
  publishedPackages?: any[];
  sessions?: AuthSessionDTO[];
  reports?: PublishedReportDTO[];
}): Promise<void> {
  if (!client) return;

  try {
    if (localData.users && localData.users.length > 0) {
      for (const u of localData.users) {
        const existing = await getSupabaseUserByUsername(u.username);
        if (!existing) {
          await createSupabaseUser(u).catch(() => {});
        }
      }
    }

    if (localData.chatMessages && localData.chatMessages.length > 0) {
      for (const msg of localData.chatMessages) {
        const { data } = await client.from('chat_messages').select('id').eq('id', msg.id).maybeSingle();
        if (!data) {
          await createSupabaseChatMessage(msg).catch(() => {});
        }
      }
    }

    if (localData.publishedPackages && localData.publishedPackages.length > 0) {
      for (const pkg of localData.publishedPackages) {
        const { data } = await client.from('published_packages').select('id').eq('id', pkg.id).maybeSingle();
        if (!data) {
          await upsertSupabasePublished(pkg).catch(() => {});
        }
      }
    }

    if (localData.sessions && localData.sessions.length > 0) {
      for (const sess of localData.sessions) {
        if (new Date(sess.expiresAt) > new Date()) {
          const existing = await getSupabaseSessionByToken(sess.token);
          if (!existing) {
            await createSupabaseSession(sess).catch(() => {});
          }
        }
      }
    }

    if (localData.reports && localData.reports.length > 0) {
      for (const rep of localData.reports) {
        await createSupabaseReport(rep).catch(() => {});
      }
    }
  } catch (err) {
    console.error('[Supabase] Data sync encountered warning:', err);
  }
}
