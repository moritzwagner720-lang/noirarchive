-- ========================================================================
-- NOIR ARCHIVE — Production Supabase PostgreSQL Schema & Migration
-- Safe for execution on fresh or existing Supabase projects.
-- Idempotent: Does NOT drop existing tables or delete existing user data.
-- ========================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================================================
-- 1. TABLES DEFINITION (IDEMPOTENT)
-- ========================================================================

-- 1.1 USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  bio TEXT DEFAULT 'Visual artist and photographer.',
  avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  location TEXT DEFAULT 'Worldwide',
  password_hash TEXT NOT NULL,
  friends TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case-insensitive index for handle lookups and global search
CREATE INDEX IF NOT EXISTS idx_users_username_lower ON public.users (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_users_location ON public.users (LOWER(location));

-- 1.2 FRIEND REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id TEXT PRIMARY KEY,
  from_username TEXT NOT NULL REFERENCES public.users(username) ON UPDATE CASCADE ON DELETE CASCADE,
  to_username TEXT NOT NULL REFERENCES public.users(username) ON UPDATE CASCADE ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_from ON public.friend_requests (LOWER(from_username));
CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON public.friend_requests (LOWER(to_username));
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON public.friend_requests (status);

-- 1.3 CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id TEXT PRIMARY KEY,
  sender_username TEXT NOT NULL REFERENCES public.users(username) ON UPDATE CASCADE ON DELETE CASCADE,
  recipient_username TEXT NOT NULL REFERENCES public.users(username) ON UPDATE CASCADE ON DELETE CASCADE,
  text TEXT DEFAULT '',
  attachment JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation 
  ON public.chat_messages (LOWER(sender_username), LOWER(recipient_username), created_at ASC);

-- 1.4 TRANSFERS TABLE (Client Delivery Packages)
CREATE TABLE IF NOT EXISTS public.transfers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  sender_username TEXT NOT NULL,
  recipient_email TEXT DEFAULT '',
  recipient_username TEXT DEFAULT '',
  files JSONB NOT NULL DEFAULT '[]'::JSONB,
  total_size TEXT DEFAULT '0 B',
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  downloads_count INTEGER DEFAULT 0,
  reviews JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfers_sender ON public.transfers (LOWER(sender_username));
CREATE INDEX IF NOT EXISTS idx_transfers_recipient ON public.transfers (LOWER(recipient_username));
CREATE INDEX IF NOT EXISTS idx_transfers_status ON public.transfers (status);

-- 1.5 PUBLISHED PACKAGES TABLE (Community Showcase)
CREATE TABLE IF NOT EXISTS public.published_packages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  photographer TEXT NOT NULL,
  avatar TEXT DEFAULT '',
  cover_image TEXT DEFAULT '',
  images JSONB DEFAULT '[]'::JSONB,
  description TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}'::TEXT[],
  downloads_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  liked_by TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_published_created ON public.published_packages (created_at DESC);

-- 1.6 FRIEND GROUPS TABLE
CREATE TABLE IF NOT EXISTS public.friend_groups (
  id TEXT PRIMARY KEY,
  owner_username TEXT NOT NULL,
  name TEXT NOT NULL,
  member_usernames TEXT[] DEFAULT '{}'::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_friend_groups_owner ON public.friend_groups (LOWER(owner_username));

-- User settings and profile columns (Idempotent)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS selected_theme TEXT DEFAULT 'graphite';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS group_privacy TEXT DEFAULT 'friends';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS custom_avatar TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS oauth_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS oauth_provider TEXT;

-- Chat messages group, replies, and reactions columns (Idempotent)
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS group_id TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS reply_to JSONB;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::JSONB;

CREATE INDEX IF NOT EXISTS idx_chat_messages_group ON public.chat_messages (group_id, created_at ASC);

-- ========================================================================
-- 2. ROW LEVEL SECURITY (RLS) & ACCESS CONTROL
-- ========================================================================

-- Enable and FORCE Row Level Security on all private tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests FORCE ROW LEVEL SECURITY;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages FORCE ROW LEVEL SECURITY;

ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers FORCE ROW LEVEL SECURITY;

ALTER TABLE public.published_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_packages FORCE ROW LEVEL SECURITY;

-- 2.1 Service Role Policies (Full Backend Access)
-- The backend uses the Supabase service_role key to perform privileged operations.
DROP POLICY IF EXISTS "Service role full access on users" ON public.users;
CREATE POLICY "Service role full access on users" ON public.users
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on friend_requests" ON public.friend_requests;
CREATE POLICY "Service role full access on friend_requests" ON public.friend_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on chat_messages" ON public.chat_messages;
CREATE POLICY "Service role full access on chat_messages" ON public.chat_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on transfers" ON public.transfers;
CREATE POLICY "Service role full access on transfers" ON public.transfers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on published_packages" ON public.published_packages;
CREATE POLICY "Service role full access on published_packages" ON public.published_packages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2.2 Direct Client Access Restrictions
-- Completely revoke direct SELECT/INSERT/UPDATE/DELETE on private tables from anon and authenticated clients.
-- password_hash, private date_of_birth, and private user data are thereby completely inaccessible via direct client table queries.
REVOKE ALL ON TABLE public.users FROM anon, authenticated;
REVOKE ALL ON TABLE public.friend_requests FROM anon, authenticated;
REVOKE ALL ON TABLE public.chat_messages FROM anon, authenticated;

-- Ensure service_role has complete permissions on all tables
GRANT ALL ON TABLE public.users TO service_role;
GRANT ALL ON TABLE public.friend_requests TO service_role;
GRANT ALL ON TABLE public.chat_messages TO service_role;
GRANT ALL ON TABLE public.transfers TO service_role;
GRANT ALL ON TABLE public.published_packages TO service_role;

-- 2.3 Public Showcase & Transfers Access Rules
-- Published showcase packages are read-only for anonymous and authenticated users (not writable).
DROP POLICY IF EXISTS "Public can view published showcase packages" ON public.published_packages;
CREATE POLICY "Public can view published showcase packages" ON public.published_packages
  FOR SELECT TO anon, authenticated USING (true);

REVOKE INSERT, UPDATE, DELETE ON TABLE public.published_packages FROM anon, authenticated;
GRANT SELECT ON TABLE public.published_packages TO anon, authenticated;

-- Transfers: active transfers can be looked up by recipient/direct link (read-only, not writable).
DROP POLICY IF EXISTS "Public can view active transfers by ID" ON public.transfers;
CREATE POLICY "Public can view active transfers by ID" ON public.transfers
  FOR SELECT TO anon, authenticated USING (status = 'active');

REVOKE INSERT, UPDATE, DELETE ON TABLE public.transfers FROM anon, authenticated;
GRANT SELECT ON TABLE public.transfers TO anon, authenticated;

-- ========================================================================
-- 3. PUBLIC USERS VIEW (SAFE & PRIVATE)
-- ========================================================================
-- Safe migration approach: Avoid DROP VIEW ... CASCADE which silently deletes
-- dependent database objects. Use DROP VIEW IF EXISTS ... RESTRICT or CREATE OR REPLACE VIEW.
-- This view exposes ONLY non-sensitive profile fields:
-- Excluded: password_hash (credential privacy)
-- Excluded: date_of_birth (private age verification data never leaked)
-- Excluded: friends (friend relationships remain private)

DROP VIEW IF EXISTS public.public_users RESTRICT;

CREATE VIEW public.public_users 
WITH (security_barrier = true) AS
SELECT
  id,
  username,
  bio,
  avatar,
  custom_avatar,
  location,
  created_at
FROM public.users;

-- View Ownership & Permissions
ALTER VIEW public.public_users OWNER TO postgres;

-- Only grant SELECT on the public view to anonymous and authenticated roles
REVOKE ALL ON TABLE public.public_users FROM PUBLIC;
GRANT SELECT ON TABLE public.public_users TO anon, authenticated;
GRANT ALL ON TABLE public.public_users TO service_role;

-- ========================================================================
-- 4. PRODUCTION SEEDING NOTE
-- ========================================================================
-- Demo user accounts (moritz, elena_k, kenji_mono, daddy) and sample chat messages
-- with legacy insecure password hashes have been removed for production security.
-- Real user accounts are registered via the secure signup API endpoint with standard hashing.
-- ========================================================================
