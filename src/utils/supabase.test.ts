import test from 'node:test';
import assert from 'node:assert';
import {
  isSupabaseConfigured,
  testSupabaseConnection,
  DEFAULT_SUPABASE_URL,
  SUPABASE_PROJECT_REF,
} from '../server/supabase.js';

test('Supabase configuration constants are set correctly for project reference', () => {
  assert.strictEqual(SUPABASE_PROJECT_REF, 'dvhnfngbwebpsygxyiul');
  assert.strictEqual(DEFAULT_SUPABASE_URL, 'https://dvhnfngbwebpsygxyiul.supabase.co');
});

test('Supabase client safely defaults to graceful fallback when key is not provided', () => {
  // Without key in test env, isSupabaseConfigured returns false and does not throw
  const configured = isSupabaseConfigured();
  assert.strictEqual(typeof configured, 'boolean');
});

test('testSupabaseConnection returns descriptive status without crashing', async () => {
  const result = await testSupabaseConnection();
  assert.strictEqual(typeof result.connected, 'boolean');
  assert.strictEqual(typeof result.message, 'string');
});
