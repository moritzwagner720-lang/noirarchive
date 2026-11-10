/**
 * API configuration and helper for Noir Archive.
 * Points production requests to https://noirarchive.onrender.com by default in Electron,
 * while supporting local development proxies and runtime configuration.
 */

import { APP_VERSION } from '../version';

export const PRODUCTION_BACKEND_URL = 'https://noirarchive.onrender.com';

export function isElectronEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).noirDesktop?.isDesktop ||
    (typeof navigator !== 'undefined' && /electron/i.test(navigator.userAgent))
  );
}

export function getApiBaseUrl(): string {
  // 1. Vite environment variable if explicitly configured
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) {
    const envUrl = (import.meta as any).env.VITE_API_URL.trim();
    if (envUrl) return envUrl.replace(/\/$/, '');
  }

  // 2. Electron desktop bridge if configured via ipc/storage
  if (typeof window !== 'undefined' && (window as any).noirDesktop?.getBackendUrl) {
    try {
      const desktopUrl = (window as any).noirDesktop.getBackendUrl();
      if (
        desktopUrl &&
        desktopUrl.trim() &&
        !desktopUrl.includes('localhost') &&
        !desktopUrl.includes('127.0.0.1')
      ) {
        return desktopUrl.trim().replace(/\/$/, '');
      }
    } catch {
      // ignore
    }
  }

  // 3. Global window override (useful for manual runtime debugging)
  if (typeof window !== 'undefined' && (window as any).NOIR_API_URL) {
    return String((window as any).NOIR_API_URL).trim().replace(/\/$/, '');
  }

  // 4. If current host is the production backend or current local/dev container, relative is best
  if (typeof window !== 'undefined') {
    if (window.location.origin === PRODUCTION_BACKEND_URL) {
      return '';
    }
    // In local development or AI Studio preview container, route to same-origin dev server
    // to preserve HttpOnly authentication cookies with zero cross-origin cookie blocking
    if (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('ais-dev-') ||
      window.location.hostname.includes('ais-pre-')
    ) {
      return '';
    }
  }

  // 5. Default for ALL standalone clients (Node.js tests, Windows Electron):
  // Connects directly to production backend: https://noirarchive.onrender.com
  return PRODUCTION_BACKEND_URL;
}

export function apiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
}

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = endpoint.startsWith('http://') || endpoint.startsWith('https://') ? endpoint : apiUrl(endpoint);
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Ensure persistent token is passed in Authorization header for cross-origin and iframe contexts
  if (!headers.has('Authorization') && typeof localStorage !== 'undefined') {
    try {
      const token =
        localStorage.getItem('noir_auth_session_token') ||
        localStorage.getItem('noir_archive_session_token');
      if (token && token.trim()) {
        headers.set('Authorization', `Bearer ${token.trim()}`);
      }
    } catch {
      // ignore storage access errors
    }
  }

  return fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });
}

export interface BackendHealthResponse {
  connected: boolean;
  version?: string;
  database?: string;
  supabaseConnected?: boolean;
  message?: string;
}

export async function checkBackendHealth(): Promise<BackendHealthResponse> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(apiUrl('/api/health'), { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      return {
        connected: true,
        version: data.version || APP_VERSION,
        database: data.database,
        supabaseConnected: Boolean(data.supabaseConnected),
        message: data.supabaseMessage || 'Connected to backend',
      };
    }
    return {
      connected: false,
      message: `Backend returned status ${res.status}`,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: err.name === 'AbortError' ? 'Backend connection timed out (cold start)' : 'Cannot reach backend server',
    };
  }
}
