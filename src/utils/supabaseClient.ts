import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { apiUrl } from './api';

export const SUPABASE_PROJECT_REF = 'dvhnfngbwebpsygxyiul';
export const DEFAULT_SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;

let supabaseClientInstance: SupabaseClient | null = null;
let cachedAnonKey: string | null = null;

export async function getClientSupabase(): Promise<SupabaseClient | null> {
  if (supabaseClientInstance) return supabaseClientInstance;

  // Try import.meta.env first
  let anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  let url = (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;

  // If not found in env, fetch from backend config endpoint
  if (!anonKey) {
    try {
      const res = await fetch(apiUrl('/api/config/auth'));
      if (res.ok) {
        const config = await res.json();
        if (config.supabaseAnonKey) {
          anonKey = config.supabaseAnonKey;
          cachedAnonKey = anonKey;
        }
        if (config.supabaseUrl) {
          url = config.supabaseUrl;
        }
      }
    } catch {
      // ignore
    }
  }

  if (!anonKey) {
    // If still no key, use fallback dummy key for client instance so methods don't crash
    anonKey = cachedAnonKey || 'dummy-anon-key-fallback';
  }

  try {
    supabaseClientInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'noir_supabase_auth',
      },
    });
    return supabaseClientInstance;
  } catch (err) {
    console.warn('[SupabaseClient] Initialization error:', err);
    return null;
  }
}

/**
 * Initiates Google or Discord OAuth flow using the Supabase configuration.
 * Redirects to the current window origin with OAuth tokens.
 */
export async function signInWithOAuth(provider: 'google' | 'discord'): Promise<{ success: boolean; error?: string }> {
  try {
    const client = await getClientSupabase();
    if (!client) {
      return { success: false, error: 'Supabase client could not be initialized.' };
    }

    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}` : undefined;

    const { data, error } = await client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        queryParams: provider === 'google' ? { access_type: 'offline', prompt: 'consent' } : undefined,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data?.url && typeof window !== 'undefined') {
      window.location.href = data.url;
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || `Failed to initiate ${provider} sign-in` };
  }
}

/**
 * Checks if returning from Supabase OAuth redirect and extracts the user session.
 */
export async function checkOAuthRedirectSession(): Promise<{
  hasOAuthSession: boolean;
  user?: {
    id: string;
    email?: string;
    provider?: string;
    suggestedUsername?: string;
    avatarUrl?: string;
  };
  error?: string;
}> {
  try {
    const client = await getClientSupabase();
    if (!client) return { hasOAuthSession: false };

    // Check if URL contains auth hash fragments (#access_token or error)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      if (hash.includes('error') || search.includes('error')) {
        const params = new URLSearchParams(hash.replace(/^#/, '?') || search);
        const errorDescription = params.get('error_description') || params.get('error') || 'OAuth authentication failed';
        // Clean URL
        window.history.replaceState(null, '', window.location.pathname);
        return { hasOAuthSession: false, error: errorDescription };
      }
    }

    const { data, error } = await client.auth.getSession();
    if (error || !data.session?.user) {
      return { hasOAuthSession: false };
    }

    const user = data.session.user;
    const provider = user.app_metadata?.provider || 'oauth';
    const email = user.email;
    const rawName = user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.custom_claims?.global_name || '';
    const suggestedUsername = (user.user_metadata?.user_name || rawName.toLowerCase().replace(/[^a-z0-9_]/g, '') || email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'member').slice(0, 15);
    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || undefined;

    return {
      hasOAuthSession: true,
      user: {
        id: user.id,
        email,
        provider,
        suggestedUsername,
        avatarUrl,
      },
    };
  } catch (err: any) {
    return { hasOAuthSession: false, error: err?.message };
  }
}
