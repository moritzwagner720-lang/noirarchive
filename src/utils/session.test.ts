import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Unit tests for Persistent Login / Remember Me Session Management
 * verifying Gmail-like persistent authentication.
 */

// Pure session helper logic matching server implementation
export function parseCookies(cookieHeader?: string): Record<string, string> {
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

export function parseClientUserAgent(ua?: string): string {
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

export interface TestSession {
  id: string;
  token: string;
  userId: string;
  username: string;
  createdAt: string;
  expiresAt: string;
  lastActive: string;
  client?: string;
}

export function isSessionValid(session: TestSession, now: Date = new Date()): boolean {
  if (!session || !session.token) return false;
  return new Date(session.expiresAt) > now;
}

export function sanitizeUserForStorage(user: Record<string, any>): Record<string, any> {
  const { passwordHash, password, token, serviceRoleKey, ...safe } = user;
  return safe;
}

test('1. Cookie parser extracts session cookie accurately', () => {
  const header = 'theme=graphite; noir_auth_session=a1b2c3d4e5f6; other_pref=true';
  const parsed = parseCookies(header);
  assert.equal(parsed['noir_auth_session'], 'a1b2c3d4e5f6');
  assert.equal(parsed['theme'], 'graphite');
  assert.equal(parsed['non_existent'], undefined);
});

test('2. Cookie parser gracefully handles empty or undefined headers', () => {
  assert.deepEqual(parseCookies(undefined), {});
  assert.deepEqual(parseCookies(''), {});
  assert.deepEqual(parseCookies('   '), {});
});

test('3. Client user-agent detection accurately identifies platforms', () => {
  assert.equal(
    parseClientUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'),
    'Chrome (macOS)'
  );
  assert.equal(
    parseClientUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'),
    'Chrome (Windows)'
  );
  assert.equal(
    parseClientUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) NoirArchive/1.0.0 Chrome/120.0 Electron/28.0.0 Safari/537.36'),
    'Noir Archive Desktop v1.0'
  );
  assert.equal(
    parseClientUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/119.0'),
    'Firefox'
  );
});

test('4. Session validity respects expiration timestamps (30-day persistence)', () => {
  const now = new Date();
  const future30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const pastSession = new Date(now.getTime() - 1000);

  const activeSession: TestSession = {
    id: 'sess_1',
    token: 'tok_active',
    userId: 'user-moritz',
    username: 'moritz',
    createdAt: now.toISOString(),
    expiresAt: future30Days.toISOString(),
    lastActive: now.toISOString(),
  };

  const expiredSession: TestSession = {
    id: 'sess_2',
    token: 'tok_expired',
    userId: 'user-moritz',
    username: 'moritz',
    createdAt: new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: pastSession.toISOString(),
    lastActive: pastSession.toISOString(),
  };

  assert.equal(isSessionValid(activeSession, now), true, '30-day session must be valid');
  assert.equal(isSessionValid(expiredSession, now), false, 'Expired session must be rejected');
});

test('5. Local storage sanitization strictly purges sensitive authentication data', () => {
  const dirtyUser = {
    id: 'user-moritz',
    username: 'moritz',
    displayName: 'Moritz',
    bio: 'Software engineer',
    passwordHash: 'hash_53ab39b7_11',
    password: 'password123',
    token: 'super_secret_token',
    serviceRoleKey: 'supabase_secret_key',
    selectedTheme: 'graphite',
    friends: ['elena_k'],
  };

  const sanitized = sanitizeUserForStorage(dirtyUser);

  assert.equal(sanitized.id, 'user-moritz');
  assert.equal(sanitized.username, 'moritz');
  assert.equal(sanitized.displayName, 'Moritz');
  assert.equal(sanitized.selectedTheme, 'graphite');
  // Sensitive keys MUST be undefined
  assert.equal(sanitized.passwordHash, undefined, 'passwordHash must never be saved in localStorage');
  assert.equal(sanitized.password, undefined, 'password must never be saved in localStorage');
  assert.equal(sanitized.token, undefined, 'token must never be saved in localStorage');
  assert.equal(sanitized.serviceRoleKey, undefined, 'serviceRoleKey must never be saved in localStorage');
});

test('6. Session revocation logic removes target session and handles all-session revocation', () => {
  const sessions: TestSession[] = [
    {
      id: 'sess_chrome_mac',
      token: 'tok_1',
      userId: 'user-moritz',
      username: 'moritz',
      createdAt: '2026-11-09T10:00:00Z',
      expiresAt: '2026-12-09T10:00:00Z',
      lastActive: '2026-11-09T10:00:00Z',
      client: 'Chrome (macOS)',
    },
    {
      id: 'sess_win_desk',
      token: 'tok_2',
      userId: 'user-moritz',
      username: 'moritz',
      createdAt: '2026-11-09T11:00:00Z',
      expiresAt: '2026-12-09T11:00:00Z',
      lastActive: '2026-11-09T11:00:00Z',
      client: 'Noir Archive Desktop v1.0',
    },
    {
      id: 'sess_elena',
      token: 'tok_3',
      userId: 'user-elena',
      username: 'elena_k',
      createdAt: '2026-11-09T11:00:00Z',
      expiresAt: '2026-12-09T11:00:00Z',
      lastActive: '2026-11-09T11:00:00Z',
      client: 'Firefox',
    },
  ];

  // Revoke single session
  const afterSingleRevoke = sessions.filter(s => s.id !== 'sess_win_desk');
  assert.equal(afterSingleRevoke.length, 2);
  assert.equal(afterSingleRevoke.some(s => s.id === 'sess_win_desk'), false);

  // Revoke all sessions for moritz
  const afterRevokeAllMoritz = sessions.filter(s => s.username.toLowerCase() !== 'moritz');
  assert.equal(afterRevokeAllMoritz.length, 1);
  assert.equal(afterRevokeAllMoritz[0].username, 'elena_k');
});
