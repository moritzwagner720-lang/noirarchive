-- ========================================================================
-- NOIR ARCHIVE — Task 1B Persistence Fixes Migration
-- Safe, backward-compatible, idempotent migration.
-- Preserves all existing tables, users, sessions, and data.
-- ========================================================================

-- 1. Users table: add display_name, settings, favorite_package_ids
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS favorite_package_ids TEXT[] DEFAULT '{}'::TEXT[];

-- 2. Published packages table: add missing metadata & moderation columns
ALTER TABLE public.published_packages ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';
ALTER TABLE public.published_packages ADD COLUMN IF NOT EXISTS is_mature BOOLEAN DEFAULT false;
ALTER TABLE public.published_packages ADD COLUMN IF NOT EXISTS downloads_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.published_packages ADD COLUMN IF NOT EXISTS reported_by TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE public.published_packages ADD COLUMN IF NOT EXISTS reports_count INTEGER DEFAULT 0;
ALTER TABLE public.published_packages ADD COLUMN IF NOT EXISTS file_count INTEGER DEFAULT 0;
ALTER TABLE public.published_packages ADD COLUMN IF NOT EXISTS total_size TEXT DEFAULT '0 B';

-- 3. Persistent Auth Sessions table
CREATE TABLE IF NOT EXISTS public.auth_sessions (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  client TEXT DEFAULT 'Web Browser',
  ip TEXT DEFAULT '127.0.0.1'
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON public.auth_sessions (token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_username ON public.auth_sessions (LOWER(username));

ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_sessions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on auth_sessions" ON public.auth_sessions;
CREATE POLICY "Service role full access on auth_sessions" ON public.auth_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. Persistent Published Reports table
CREATE TABLE IF NOT EXISTS public.published_reports (
  id TEXT PRIMARY KEY,
  package_id TEXT NOT NULL,
  reported_by TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT 'inappropriate',
  details TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_published_reports_package ON public.published_reports (package_id);

ALTER TABLE public.published_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_reports FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on published_reports" ON public.published_reports;
CREATE POLICY "Service role full access on published_reports" ON public.published_reports
  FOR ALL TO service_role USING (true) WITH CHECK (true);
