import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getDefaultAvatarInitial,
  getAvatarColorForUsername,
  generateLetterAvatar,
} from './avatar';
import {
  THEMES,
  DEFAULT_THEME_ID,
  getThemeById,
  isSeasonalTheme,
} from './themes';
import {
  createFriendGroup,
  addMemberToGroup,
  removeMemberFromGroup,
  renameFriendGroup,
  canAddToGroup,
} from './groups';
import { INITIAL_USERS } from '../data/mockData';

describe('1. Letter-Based Avatar System (Requirement 2)', () => {
  test('extracts uppercase initial correctly for diverse usernames', () => {
    assert.equal(getDefaultAvatarInitial('Moritz'), 'M');
    assert.equal(getDefaultAvatarInitial('Alex'), 'A');
    assert.equal(getDefaultAvatarInitial('NoirArchive'), 'N');
    assert.equal(getDefaultAvatarInitial('elena_k'), 'E');
    assert.equal(getDefaultAvatarInitial('kenji_mono'), 'K');
    assert.equal(getDefaultAvatarInitial('@daddy'), 'D');
    assert.equal(getDefaultAvatarInitial('333k'), '3');
    assert.equal(getDefaultAvatarInitial(''), 'N');
  });

  test('generates deterministic subtle background color for the same username', () => {
    const color1 = getAvatarColorForUsername('moritz');
    const color2 = getAvatarColorForUsername('moritz');
    assert.equal(color1.hex, color2.hex);
    assert.ok(color1.hex.startsWith('#'));
    assert.ok(color1.accent.startsWith('#'));
  });

  test('generateLetterAvatar produces valid SVG data URI without human faces', () => {
    const svgData = generateLetterAvatar('M', '#313338', '#5865f2');
    assert.ok(svgData.startsWith('data:image/svg+xml;utf8,'));
    assert.ok(decodeURIComponent(svgData).includes('>M<'));
    assert.ok(!svgData.includes('unsplash.com'));
    assert.ok(!svgData.includes('http://images'));
  });

  test('initial users have zero human profile picture URLs', () => {
    INITIAL_USERS.forEach(user => {
      if (user.avatar) {
        assert.ok(
          !user.avatar.includes('unsplash.com'),
          `User @${user.username} must not have an Unsplash human portrait`
        );
      }
    });
  });
});

describe('2. Complete Theme Customization System (Requirement 6)', () => {
  test('includes exactly 10 standard themes + 2 optional seasonal themes', () => {
    const standard = THEMES.filter(t => t.type === 'standard');
    const seasonal = THEMES.filter(t => t.type === 'seasonal');

    assert.equal(standard.length, 10, 'Must have exactly 10 standard themes');
    assert.equal(seasonal.length, 2, 'Must have exactly 2 seasonal themes (Christmas & Halloween)');

    const expectedStandardIds = [
      'graphite',
      'midnight',
      'arctic',
      'purple',
      'emerald',
      'crimson',
      'rose',
      'ocean',
      'amber',
      'monochrome',
    ];

    expectedStandardIds.forEach(id => {
      const found = standard.find(t => t.id === id);
      assert.ok(found, `Standard theme '${id}' must exist`);
    });

    const expectedSeasonalIds = ['christmas', 'halloween'];
    expectedSeasonalIds.forEach(id => {
      const found = seasonal.find(t => t.id === id);
      assert.ok(found, `Seasonal theme '${id}' must exist`);
    });
  });

  test('default theme is graphite with Discord dark charcoal backgrounds', () => {
    assert.equal(DEFAULT_THEME_ID, 'graphite');
    const graphite = getThemeById('graphite');
    assert.equal(graphite.id, 'graphite');
    assert.equal(graphite.bgBase, '#1e1f22');
    assert.equal(graphite.bgSurface, '#2b2d31');
    assert.equal(graphite.bgElevated, '#313338');
    assert.equal(graphite.borderColor, '#383a40');
  });

  test('seasonal themes are flagged and do not activate automatically', () => {
    assert.equal(isSeasonalTheme('christmas'), true);
    assert.equal(isSeasonalTheme('halloween'), true);
    assert.equal(isSeasonalTheme('graphite'), false);
    assert.equal(isSeasonalTheme('midnight'), false);
  });

  test('seasonal themes have custom background images configured', () => {
    const christmas = getThemeById('christmas');
    const halloween = getThemeById('halloween');

    assert.ok(christmas.backgroundImage, 'Christmas theme must have a background image');
    assert.ok(halloween.backgroundImage, 'Halloween theme must have a background image');

    assert.ok(christmas.backgroundImage.includes('christmas-bg.jpg') || christmas.backgroundImage.includes('zpJ61'));
    assert.ok(halloween.backgroundImage.includes('halloween-bg.jpg') || halloween.backgroundImage.includes('1MHV8'));

    // Standard themes must retain original backgrounds (no background image)
    const graphite = getThemeById('graphite');
    const midnight = getThemeById('midnight');
    const arctic = getThemeById('arctic');

    assert.equal(graphite.backgroundImage, undefined, 'Graphite theme must retain original charcoal background');
    assert.equal(midnight.backgroundImage, undefined, 'Midnight theme must retain original background');
    assert.equal(arctic.backgroundImage, undefined, 'Arctic theme must retain original background');
  });
});

describe('3. Friend Groups System (Requirement 4)', () => {
  test('creates a friend group with custom name and owner', () => {
    const group = createFriendGroup('moritz', 'Design Squad', ['elena_k', 'kenji_mono']);
    assert.ok(group.id.startsWith('grp-'));
    assert.equal(group.ownerUsername, 'moritz');
    assert.equal(group.name, 'Design Squad');
    assert.deepEqual(group.memberUsernames, ['elena_k', 'kenji_mono']);
  });

  test('prevents creating group with empty or whitespace name', () => {
    assert.throws(() => {
      createFriendGroup('moritz', '   ');
    }, /Group name is required/);
  });

  test('adds existing friend to group without duplicates', () => {
    let group = createFriendGroup('moritz', 'Family', ['elena_k']);
    group = addMemberToGroup(group, 'kenji_mono');
    assert.equal(group.memberUsernames.length, 2);
    assert.ok(group.memberUsernames.includes('kenji_mono'));

    // Duplicate add should be idempotent
    group = addMemberToGroup(group, 'kenji_mono');
    assert.equal(group.memberUsernames.length, 2);
  });

  test('removes member from group', () => {
    let group = createFriendGroup('moritz', 'Gaming', ['elena_k', 'kenji_mono']);
    group = removeMemberFromGroup(group, 'elena_k');
    assert.equal(group.memberUsernames.length, 1);
    assert.ok(!group.memberUsernames.includes('elena_k'));
    assert.ok(group.memberUsernames.includes('kenji_mono'));
  });

  test('renames friend group with trimmed valid name', () => {
    let group = createFriendGroup('moritz', 'Old Name');
    group = renameFriendGroup(group, '  New Project Group  ');
    assert.equal(group.name, 'New Project Group');
  });
});

describe('4. Group Invitation Privacy Setting (Requirement 5)', () => {
  const targetUserEveryone = {
    id: 'u1',
    username: 'alice',
    passwordHash: 'hash',
    createdAt: '2026-01-01',
    friends: ['bob'],
    groupPrivacy: 'everyone' as const,
  };

  const targetUserFriendsOnly = {
    id: 'u2',
    username: 'bob',
    passwordHash: 'hash',
    createdAt: '2026-01-01',
    friends: ['alice'],
    groupPrivacy: 'friends' as const,
  };

  const targetUserNobody = {
    id: 'u3',
    username: 'charlie',
    passwordHash: 'hash',
    createdAt: '2026-01-01',
    friends: ['alice', 'bob'],
    groupPrivacy: 'nobody' as const,
  };

  test('"everyone": any user can add target to groups', () => {
    const check1 = canAddToGroup('bob', targetUserEveryone);
    assert.equal(check1.allowed, true);

    const checkStranger = canAddToGroup('stranger', targetUserEveryone);
    assert.equal(checkStranger.allowed, true);
  });

  test('"friends": only existing friends can add target to groups', () => {
    // alice is friends with bob
    const friendCheck = canAddToGroup('alice', targetUserFriendsOnly);
    assert.equal(friendCheck.allowed, true);

    // stranger is NOT friends with bob
    const strangerCheck = canAddToGroup('stranger', targetUserFriendsOnly);
    assert.equal(strangerCheck.allowed, false);
    assert.ok(strangerCheck.error?.includes('@bob only allows friends to add them to groups'));
  });

  test('"nobody": other users cannot add target to groups', () => {
    // alice is friends with charlie, but charlie set privacy to 'nobody'
    const friendAttempt = canAddToGroup('alice', targetUserNobody);
    assert.equal(friendAttempt.allowed, false);
    assert.ok(friendAttempt.error?.includes('@charlie does not allow other users to add them to groups'));

    const strangerAttempt = canAddToGroup('stranger', targetUserNobody);
    assert.equal(strangerAttempt.allowed, false);
    assert.ok(strangerAttempt.error?.includes('@charlie does not allow other users to add them to groups'));
  });
});
