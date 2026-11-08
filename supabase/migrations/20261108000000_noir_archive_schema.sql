-- ========================================================================
-- NOIR ARCHIVE — Supabase PostgreSQL Schema & Migration
-- Project Reference: dvhnfngbwebpsygxyiul
-- ========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
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

CREATE INDEX IF NOT EXISTS idx_users_username_lower ON public.users (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_users_location ON public.users (LOWER(location));

-- 2. FRIEND REQUESTS TABLE
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

-- 3. CHAT MESSAGES TABLE
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

-- 4. TRANSFERS TABLE
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

-- 5. PUBLISHED PACKAGES TABLE
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

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_packages ENABLE ROW LEVEL SECURITY;

-- Service role policies
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

-- Public read policies
DROP POLICY IF EXISTS "Public can view usernames and profiles" ON public.users;
CREATE POLICY "Public can view usernames and profiles" ON public.users
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public can view published showcase packages" ON public.published_packages;
CREATE POLICY "Public can view published showcase packages" ON public.published_packages
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public can view active transfers by ID" ON public.transfers;
CREATE POLICY "Public can view active transfers by ID" ON public.transfers
  FOR SELECT TO anon, authenticated USING (status = 'active');

-- Seed existing users
INSERT INTO public.users (id, username, bio, avatar, location, password_hash, friends, created_at)
VALUES 
  ('user-moritz', 'moritz', 'Architectural and minimalist street photography. Exploring geometric tension, concrete textures, and natural contrast.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', 'Berlin', 'hash_53ab39b7_11', ARRAY['elena_k', 'kenji_mono'], '2024-01-15T10:00:00.000Z'),
  ('user-elena', 'elena_k', 'Monochrome portraiture, sculptural fashion, and darkroom chiaroscuro.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', 'Paris', 'hash_2c1542db_9', ARRAY['moritz'], '2024-02-01T12:00:00.000Z'),
  ('user-kenji', 'kenji_mono', 'Nocturnal street observer. Capturing midnight rain, subway shadows, and solitary moments across Tokyo.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', 'Tokyo', 'hash_49b28bb5_7', ARRAY['moritz'], '2024-03-10T09:30:00.000Z'),
  ('user-daddy', 'daddy', 'Visual artist and photographer.', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80', 'Berlin', 'hash_53ab39b7_11', ARRAY[]::TEXT[], '2024-04-01T09:30:00.000Z')
ON CONFLICT (username) DO NOTHING;

INSERT INTO public.chat_messages (id, sender_username, recipient_username, text, created_at)
VALUES ('msg-1794061673032-30', 'moritz', 'daddy', 'Hey daddy, real-time messaging is now working instantly!', '2026-11-07T14:27:53.032Z')
ON CONFLICT (id) DO NOTHING;
