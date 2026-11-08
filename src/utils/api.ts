/**
 * API configuration and helper for Noir Archive.
 * Supports public production backend, custom environment URLs, and local fallback.
 */

export function getApiBaseUrl(): string {
  // 1. Vite environment variable if set
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) {
    return (import.meta as any).env.VITE_API_URL.replace(/\/$/, '');
  }

  // 2. Electron desktop bridge if configured
  if (typeof window !== 'undefined' && window.noirDesktop?.getBackendUrl) {
    try {
      const desktopUrl = window.noirDesktop.getBackendUrl();
      if (desktopUrl) return desktopUrl.replace(/\/$/, '');
    } catch {
      // ignore
    }
  }

  // 3. Global window override (useful for runtime configuration)
  if (typeof window !== 'undefined' && window.NOIR_API_URL) {
    return window.NOIR_API_URL.replace(/\/$/, '');
  }

  // 4. Default: empty string (relative to current origin, works seamlessly in browser)
  return '';
}

export function apiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
}
