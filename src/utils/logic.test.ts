import test from 'node:test';
import assert from 'node:assert/strict';
import { validateUsername, validatePassword, hashPassword, verifyPassword } from './auth';
import { createTransferPackage, verifyTransferAccess, calculateTotalTransferSize } from './transfer';
import { canSendFriendRequest, createChatMessage } from './friends';

test('validateUsername enforces uniqueness and format', () => {
  const existingUsers = [
    { username: 'moritz' },
    { username: 'ansel_adams' },
    { username: 'leica_master' },
  ];

  // Empty
  assert.equal(validateUsername('', existingUsers).isValid, false);
  assert.equal(validateUsername('   ', existingUsers).isValid, false);

  // Too short
  assert.equal(validateUsername('ab', existingUsers).isValid, false);

  // Invalid chars
  assert.equal(validateUsername('moritz!@#', existingUsers).isValid, false);
  assert.equal(validateUsername('user name', existingUsers).isValid, false);

  // Taken (case-insensitive)
  assert.equal(validateUsername('moritz', existingUsers).isValid, false);
  assert.equal(validateUsername('Moritz', existingUsers).isValid, false);
  assert.equal(validateUsername('MORITZ', existingUsers).isValid, false);
  assert.equal(validateUsername('ansel_adams', existingUsers).isValid, false);

  // Valid and unique
  const valid = validateUsername('elena_noir', existingUsers);
  assert.equal(valid.isValid, true);
  assert.equal(valid.error, undefined);
});

test('validatePassword checks minimum length and strength', () => {
  // Too short
  assert.equal(validatePassword('12345').isValid, false);

  // Valid basic
  const basic = validatePassword('secret1');
  assert.equal(basic.isValid, true);

  // Strong
  const strong = validatePassword('Monochrome!2026');
  assert.equal(strong.isValid, true);
  assert.equal(strong.score >= 3, true);
});

test('hashPassword and verifyPassword work deterministically', () => {
  const hash = hashPassword('MySafePassword#1');
  assert.equal(verifyPassword('MySafePassword#1', hash), true);
  assert.equal(verifyPassword('WrongPassword', hash), false);
});

test('createTransferPackage creates transfer with proper attributes', () => {
  const pkg = createTransferPackage({
    senderId: 'u1',
    senderUsername: 'moritz',
    title: 'Editorial Selection Berlin',
    note: 'Hi, here are the high-res black and white proofs.',
    recipientType: 'username',
    recipientUsername: 'art_director',
    password: 'deliverypassword123',
    expiryDays: 7,
    files: [
      { id: 'f1', name: '01_brutalism.jpg', size: '12.4 MB', type: 'image/jpeg', url: 'https://example.com/1.jpg' },
      { id: 'f2', name: '02_shadows.jpg', size: '18.1 MB', type: 'image/jpeg', url: 'https://example.com/2.jpg' },
    ],
  });

  assert.ok(pkg.id.startsWith('TR-'));
  assert.equal(pkg.senderUsername, 'moritz');
  assert.equal(pkg.recipientUsername, 'art_director');
  assert.equal(pkg.hasPassword, true);
  assert.ok(pkg.expiresAt !== null);

  // Access checks
  assert.equal(verifyTransferAccess(pkg, 'wrong').canAccess, false);
  assert.equal(verifyTransferAccess(pkg, 'deliverypassword123').canAccess, true);
});

test('calculateTotalTransferSize correctly aggregates file sizes', () => {
  const files = [
    { id: '1', name: 'a.jpg', size: '5.5 MB', type: 'image/jpeg', url: '' },
    { id: '2', name: 'b.jpg', size: '4.5 MB', type: 'image/jpeg', url: '' },
  ];
  assert.equal(calculateTotalTransferSize(files), '10.0 MB');
});

test('canSendFriendRequest validates recipient rules and duplicates', () => {
  const currentFriends = ['elena_k'];
  const existingRequests = [
    { id: '1', fromUsername: 'moritz', toUsername: 'kenji_mono', status: 'pending' as const, createdAt: '' },
  ];

  // Self request disallowed
  assert.equal(canSendFriendRequest('moritz', 'moritz', currentFriends, existingRequests).allowed, false);

  // Already friend disallowed
  assert.equal(canSendFriendRequest('moritz', 'elena_k', currentFriends, existingRequests).allowed, false);

  // Already pending disallowed
  assert.equal(canSendFriendRequest('moritz', 'kenji_mono', currentFriends, existingRequests).allowed, false);

  // New valid request allowed
  assert.equal(canSendFriendRequest('moritz', 'ansel', currentFriends, existingRequests).allowed, true);
});

test('createChatMessage builds structured message with file/folder attachment', () => {
  const msg = createChatMessage('moritz', 'elena_k', 'Here are the proofing negatives for the front page', {
    type: 'folder',
    title: 'Monoliths_Folder',
    files: [
      { id: '1', name: 'img1.jpg', size: '14 MB', type: 'image/jpeg', url: '' }
    ],
    totalSize: '14 MB',
  });

  assert.equal(msg.senderUsername, 'moritz');
  assert.equal(msg.recipientUsername, 'elena_k');
  assert.equal(msg.attachment?.type, 'folder');
  assert.equal(msg.attachment?.files.length, 1);
});

test('createPublishedPackage creates valid public bundle and validates input', async () => {
  const { createPublishedPackage, filterPublishedPackages, togglePackageLike } = await import('./published.ts');

  // Throws on empty title
  assert.throws(() => {
    createPublishedPackage({
      title: '',
      description: 'Test',
      authorUsername: 'moritz',
      files: [{ id: '1', name: 'f1.jpg', size: '10 MB', type: 'image/jpeg', url: '' }],
    });
  });

  // Throws on empty files
  assert.throws(() => {
    createPublishedPackage({
      title: 'Valid Title',
      description: 'Test',
      authorUsername: 'moritz',
      files: [],
    });
  });

  // Valid creation
  const pkg = createPublishedPackage({
    title: 'Minimalist Architecture Pack',
    description: 'High res scans',
    authorUsername: 'moritz',
    files: [
      { id: '1', name: 'f1.jpg', size: '10.0 MB', type: 'image/jpeg', url: 'https://example.com/1.jpg' },
      { id: '2', name: 'f2.jpg', size: '15.0 MB', type: 'image/jpeg', url: 'https://example.com/2.jpg' },
    ],
  });

  assert.equal(pkg.title, 'Minimalist Architecture Pack');
  assert.equal(pkg.authorUsername, 'moritz');
  assert.equal(pkg.downloadsCount, 0);
  assert.equal(pkg.likesCount, 0);
  assert.equal(pkg.files.length, 2);

  // Filter test
  const filtered = filterPublishedPackages([pkg], 'Architecture', 'all');
  assert.equal(filtered.length, 1);

  const emptyFilter = filterPublishedPackages([pkg], 'NonExistentTerm', 'all');
  assert.equal(emptyFilter.length, 0);

  // Like toggle test
  const { updatedPackage, isLiked } = togglePackageLike(pkg, 'elena_k');
  assert.equal(isLiked, true);
  assert.equal(updatedPackage.likesCount, 1);
  assert.equal(updatedPackage.likedBy?.includes('elena_k'), true);

  // Unlike toggle test
  const unliked = togglePackageLike(updatedPackage, 'elena_k');
  assert.equal(unliked.isLiked, false);
  assert.equal(unliked.updatedPackage.likesCount, 0);
});

test('user credentials and authentication gate logic', () => {
  const users = [
    { username: 'moritz', passwordHash: hashPassword('password123') },
    { username: 'elena_k', passwordHash: hashPassword('secret456') },
    { username: 'kenji_mono', passwordHash: hashPassword('mono789') },
  ];

  // Correct credentials authenticate
  const moritz = users.find(u => u.username === 'moritz');
  assert.ok(moritz);
  assert.equal(verifyPassword('password123', moritz.passwordHash), true);

  // Incorrect credentials fail
  assert.equal(verifyPassword('wrongpass', moritz.passwordHash), false);

  // Non-existent user cannot authenticate
  const nonExistent = users.find(u => u.username === 'stranger');
  assert.equal(nonExistent, undefined);
});

