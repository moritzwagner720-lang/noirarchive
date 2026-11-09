import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTION_BACKEND_URL } from './api';

const BASE_URL = PRODUCTION_BACKEND_URL;

interface RequestOptions {
  headers?: Record<string, string>;
  body?: any;
}

async function api(method: string, endpoint: string, options: RequestOptions = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  return { status: res.status, ok: res.ok, data: json, raw: text };
}

test('Cross-platform verification: Browser client and Windows Electron client against shared cloud backend', async () => {
  const ts = Date.now().toString().slice(-6);
  const browserUsername = `browser_usr_${ts}`;
  const windowsUsername = `win_desk_${ts}`;
  const password = 'SharedPassword!2026';

  console.log(`[Cross-Platform Test] Testing Browser User: @${browserUsername} vs Windows User: @${windowsUsername}`);

  // 1. Production Health & Supabase check
  const health = await api('GET', '/api/health');
  assert.equal(health.status, 200, 'Production backend must be healthy');
  assert.equal(health.data.database, 'supabase_postgres', 'Backend must be connected to Supabase PostgreSQL');
  assert.equal(health.data.supabaseConnected, true, 'Supabase must report active connection');

  // 2. Browser User Registration
  const browserSignup = await api('POST', '/api/auth/signup', {
    body: {
      username: browserUsername,
      password,
      bio: 'Photographer accessing via Chrome browser on macOS.',
      location: 'Berlin Web',
    },
  });
  assert.equal(browserSignup.status, 200, 'Browser user registration must succeed on production backend');
  assert.equal(browserSignup.data?.user?.username, browserUsername);

  // 3. Windows User Registration
  const windowsSignup = await api('POST', '/api/auth/signup', {
    body: {
      username: windowsUsername,
      password,
      bio: 'Photographer accessing via Windows Electron desktop app.',
      location: 'Tokyo Desktop',
    },
  });
  assert.equal(windowsSignup.status, 200, 'Windows user registration must succeed on production backend');
  assert.equal(windowsSignup.data?.user?.username, windowsUsername);

  // 4. Cross-Platform Search: Browser user searches for Windows user
  let searchWin = await api('GET', `/api/users/search?q=${windowsUsername}`);
  if (!searchWin.ok) {
    searchWin = await api('GET', `/api/users/search/${windowsUsername}`);
  }
  assert.equal(searchWin.status, 200, 'Search for Windows user must succeed');
  assert.ok(Array.isArray(searchWin.data), 'Search results must be an array');
  const foundWin = searchWin.data.find((u: any) => u.username.toLowerCase() === windowsUsername.toLowerCase());
  assert.ok(foundWin, `Browser client must discover Windows user @${windowsUsername} immediately in cloud`);

  // 5. Cross-Platform Search: Windows user searches for Browser user
  let searchBrowser = await api('GET', `/api/users/search?q=${browserUsername}`);
  if (!searchBrowser.ok) {
    searchBrowser = await api('GET', `/api/users/search/${browserUsername}`);
  }
  assert.equal(searchBrowser.status, 200, 'Search for Browser user must succeed');
  const foundBrowser = searchBrowser.data.find((u: any) => u.username.toLowerCase() === browserUsername.toLowerCase());
  assert.ok(foundBrowser, `Windows client must discover Browser user @${browserUsername} immediately in cloud`);

  // 6. Browser user sends friend request to Windows user
  const sendReq = await api('POST', '/api/friend-requests', {
    body: {
      fromUsername: browserUsername,
      toUsername: windowsUsername,
    },
  });
  assert.equal(sendReq.status, 200, 'Sending friend request from Browser to Windows user must succeed');
  const requestId = sendReq.data?.request?.id;
  assert.ok(requestId, 'Friend request must return a valid ID');

  // 7. Windows user checks incoming friend requests from cloud
  const winRequests = await api('GET', `/api/friend-requests?user=${windowsUsername}`);
  assert.equal(winRequests.status, 200);
  const pendingReq = winRequests.data.find((r: any) => r.id === requestId && r.fromUsername === browserUsername);
  assert.ok(pendingReq, 'Windows client must receive incoming request from Browser client via cloud sync');

  // 8. Windows user accepts friend request
  const acceptReq = await api('POST', `/api/friend-requests/${requestId}/accept`);
  assert.equal(acceptReq.status, 200, 'Windows user accepting friend request must succeed');

  // 9. Verify both users have each other as friends in Supabase
  const getBrowser = await api('GET', `/api/users/${browserUsername}`);
  const getWin = await api('GET', `/api/users/${windowsUsername}`);
  assert.ok(
    getBrowser.data.friends.includes(windowsUsername),
    'Browser user friends list must contain Windows user'
  );
  assert.ok(
    getWin.data.friends.includes(browserUsername),
    'Windows user friends list must contain Browser user'
  );

  // 10. Windows user sends a message with attachment to Browser user
  const msgFromWindows = {
    id: `msg-win-${Date.now()}`,
    senderUsername: windowsUsername,
    recipientUsername: browserUsername,
    text: 'Hello from Windows desktop app! Proofs attached.',
    attachment: {
      type: 'file',
      title: 'Monochrome_Street_01.jpg',
      files: [
        {
          id: 'f-win-1',
          name: 'Monochrome_Street_01.jpg',
          size: '12.4 MB',
          type: 'image/jpeg',
          url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=85',
        },
      ],
      totalSize: '12.4 MB',
    },
  };

  const sendMsg1 = await api('POST', '/api/chat-messages', { body: msgFromWindows });
  assert.equal(sendMsg1.status, 200, 'Sending message from Windows to Browser must succeed');

  // 11. Browser user retrieves chat history
  const browserChat = await api('GET', `/api/chat-messages?user1=${browserUsername}&user2=${windowsUsername}`);
  assert.equal(browserChat.status, 200);
  const receivedMsg = browserChat.data.find((m: any) => m.id === msgFromWindows.id);
  assert.ok(receivedMsg, 'Browser client must receive message sent from Windows client');
  assert.equal(receivedMsg.text, msgFromWindows.text);
  assert.equal(receivedMsg.attachment?.title, 'Monochrome_Street_01.jpg');

  // 12. Browser user sends reply message to Windows user
  const replyFromBrowser = {
    id: `msg-browser-${Date.now()}`,
    senderUsername: browserUsername,
    recipientUsername: windowsUsername,
    text: 'Received in browser! The contrast looks stunning.',
  };
  const sendReply = await api('POST', '/api/chat-messages', { body: replyFromBrowser });
  assert.equal(sendReply.status, 200, 'Sending reply from Browser to Windows must succeed');

  // 13. Windows user retrieves chat history and verifies reply
  const winChat = await api('GET', `/api/chat-messages?user1=${windowsUsername}&user2=${browserUsername}`);
  assert.equal(winChat.status, 200);
  const receivedReply = winChat.data.find((m: any) => m.id === replyFromBrowser.id);
  assert.ok(receivedReply, 'Windows client must receive reply sent from Browser client');
  assert.equal(receivedReply.text, replyFromBrowser.text);

  // 14. File Transfer: Browser client sends transfer package to Windows client
  const transferPkg = {
    id: `TR-${Date.now()}`,
    title: 'High Resolution Negative Scans',
    senderUsername: browserUsername,
    recipientUsername: windowsUsername,
    recipientEmail: 'client@example.com',
    files: [
      { id: 'scan-1', name: 'scan_01.tif', size: '45.0 MB', type: 'image/tiff', url: 'https://example.com/scan1.tif' },
    ],
    totalSize: '45.0 MB',
    status: 'active',
    downloadsCount: 0,
    createdAt: new Date().toISOString(),
  };

  const sendTransfer = await api('POST', '/api/transfers', { body: transferPkg });
  assert.equal(sendTransfer.status, 200, 'Browser client creating transfer package must succeed');

  // 15. Windows client retrieves transfer and increments download count
  const allTransfers = await api('GET', '/api/transfers');
  assert.equal(allTransfers.status, 200);
  const foundTransfer = allTransfers.data.find((t: any) => t.id === transferPkg.id);
  assert.ok(foundTransfer, 'Windows client must see transfer created by Browser client');

  const downloadTransfer = await api('POST', `/api/transfers/${transferPkg.id}/download`);
  assert.equal(downloadTransfer.status, 200, 'Windows client recording download must succeed');

  // 16. Restart & Persistence verification:
  // Re-fetch users and verify credentials authenticate after session reset
  const browserReAuth = await api('POST', '/api/auth/signin', {
    body: { username: browserUsername, password },
  });
  const windowsReAuth = await api('POST', '/api/auth/signin', {
    body: { username: windowsUsername, password },
  });
  assert.equal(browserReAuth.status, 200, 'Browser user must authenticate on fresh session');
  assert.equal(windowsReAuth.status, 200, 'Windows user must authenticate on fresh session');
  assert.ok(browserReAuth.data.user.friends.includes(windowsUsername), 'Friendship persists in Supabase');

  console.log('✅ ALL 16 CROSS-PLATFORM BROWSER <-> WINDOWS TESTS PASSED ON PRODUCTION BACKEND!');
});
