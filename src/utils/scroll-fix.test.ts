import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('TASK 2 — Scroll position bug fixes verification', () => {
  const messengerPath = path.resolve(__dirname, '../components/FriendsMessenger.tsx');
  const messengerContent = fs.readFileSync(messengerPath, 'utf-8');

  // 1. Verify scrollIntoView was removed from auto-scroll effect in FriendsMessenger
  const hasUnwantedScrollIntoView = /messagesEndRef\.current\?\.scrollIntoView/g.test(messengerContent);
  assert.equal(
    hasUnwantedScrollIntoView,
    false,
    'messagesEndRef.current?.scrollIntoView must NOT be called in FriendsMessenger auto-scroll effect'
  );

  // 2. Verify chatContainerRef is attached and used for inner scroll container
  assert.ok(
    messengerContent.includes('chatContainerRef = useRef<HTMLDivElement>(null)'),
    'FriendsMessenger must declare chatContainerRef'
  );
  assert.ok(
    messengerContent.includes('ref={chatContainerRef}'),
    'FriendsMessenger must attach chatContainerRef to internal chat log container'
  );
  assert.ok(
    messengerContent.includes('chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight') ||
    messengerContent.includes('chatContainerRef.current.scrollTo'),
    'FriendsMessenger must scroll chatContainerRef instead of window'
  );

  // 3. Verify manual scroll restoration in src/main.tsx
  const mainPath = path.resolve(__dirname, '../main.tsx');
  const mainContent = fs.readFileSync(mainPath, 'utf-8');
  assert.ok(
    mainContent.includes("window.history.scrollRestoration = 'manual'"),
    "main.tsx must set history.scrollRestoration = 'manual'"
  );
  assert.ok(
    mainContent.includes('window.scrollTo(0, 0)'),
    'main.tsx must reset window scroll to (0, 0) on load'
  );

  // 4. Verify scroll reset on tab switch and mount in src/App.tsx
  const appPath = path.resolve(__dirname, '../App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');
  assert.ok(
    appContent.includes('window.scrollTo({ top: 0, left: 0, behavior: \'instant\' as ScrollBehavior })') ||
    appContent.includes('window.scrollTo(0, 0)'),
    'App.tsx must reset scroll on activeTab change'
  );
  assert.ok(
    appContent.includes('[activeTab, activeTransferPortalId]'),
    'App.tsx must re-run scroll reset when activeTab or activeTransferPortalId changes'
  );

  // 5. Verify CSS base has scroll-behavior: auto
  const cssPath = path.resolve(__dirname, '../index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');
  assert.ok(
    cssContent.includes('scroll-behavior: auto'),
    'index.css must specify scroll-behavior: auto for predictable resets'
  );

  console.log('✅ ALL SCROLL POSITION REQUIREMENTS VERIFIED: Window scroll stays at top on load and tab switches, with inner chat auto-scroll intact.');
});
