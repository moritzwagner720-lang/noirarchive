/**
 * Clean Letter-Based Avatar System for Noir Archive
 * Exclusively letter-based initials with modern, rounded Discord-inspired shapes
 * and subtle, elegant backgrounds. No human photos.
 */

export interface AvatarColor {
  id: string;
  name: string;
  bgHex: string;
  accentHex: string;
  hex: string;
  accent: string;
  gradient: string;
}

export const AVATAR_PALETTE: AvatarColor[] = [
  { id: 'slate', name: 'Slate Graphite', bgHex: '#313338', accentHex: '#949ba4', hex: '#313338', accent: '#949ba4', gradient: 'from-[#383a40] to-[#232428]' },
  { id: 'blurple', name: 'Discord Blurple', bgHex: '#5865f2', accentHex: '#ffffff', hex: '#5865f2', accent: '#ffffff', gradient: 'from-[#5865f2] to-[#4752c4]' },
  { id: 'indigo', name: 'Deep Indigo', bgHex: '#4f46e5', accentHex: '#ffffff', hex: '#4f46e5', accent: '#ffffff', gradient: 'from-[#6366f1] to-[#4338ca]' },
  { id: 'violet', name: 'Amethyst Violet', bgHex: '#7c3aed', accentHex: '#ffffff', hex: '#7c3aed', accent: '#ffffff', gradient: 'from-[#8b5cf6] to-[#6d28d9]' },
  { id: 'emerald', name: 'Modern Emerald', bgHex: '#059669', accentHex: '#ffffff', hex: '#059669', accent: '#ffffff', gradient: 'from-[#10b981] to-[#047857]' },
  { id: 'teal', name: 'Oceanic Teal', bgHex: '#0d9488', accentHex: '#ffffff', hex: '#0d9488', accent: '#ffffff', gradient: 'from-[#14b8a6] to-[#0f766e]' },
  { id: 'cyan', name: 'Arctic Cyan', bgHex: '#0891b2', accentHex: '#ffffff', hex: '#0891b2', accent: '#ffffff', gradient: 'from-[#06b6d4] to-[#0e7490]' },
  { id: 'amber', name: 'Golden Amber', bgHex: '#d97706', accentHex: '#ffffff', hex: '#d97706', accent: '#ffffff', gradient: 'from-[#f59e0b] to-[#b45309]' },
  { id: 'rose', name: 'Electric Rose', bgHex: '#e11d48', accentHex: '#ffffff', hex: '#e11d48', accent: '#ffffff', gradient: 'from-[#f43f5e] to-[#be123c]' },
  { id: 'crimson', name: 'Obsidian Crimson', bgHex: '#dc2626', accentHex: '#ffffff', hex: '#dc2626', accent: '#ffffff', gradient: 'from-[#ef4444] to-[#b91c1c]' },
  { id: 'cobalt', name: 'Royal Cobalt', bgHex: '#2563eb', accentHex: '#ffffff', hex: '#2563eb', accent: '#ffffff', gradient: 'from-[#3b82f6] to-[#1d4ed8]' },
  { id: 'darksteel', name: 'Titanium Steel', bgHex: '#27272a', accentHex: '#e4e4e7', hex: '#27272a', accent: '#e4e4e7', gradient: 'from-[#3f3f46] to-[#18181b]' },
];

/**
 * Extracts display initial(s) for a username.
 * Examples:
 * - "Moritz" -> "M"
 * - "Alex" -> "A"
 * - "NoirArchive" -> "N"
 * - "k3nanbaba" -> "3"
 */
export function getDefaultAvatarInitial(username: string): string {
  if (!username) return 'N';
  const clean = username.replace(/^@/, '').trim();
  if (!clean) return 'N';

  if (clean.toLowerCase() === 'k3nanbaba' || clean.toLowerCase().startsWith('k3nan')) {
    return '3';
  }

  // Return the first character capitalized
  return clean.charAt(0).toUpperCase();
}

/**
 * Deterministically pick an avatar color for a username
 */
export function getAvatarColorForUsername(username: string): AvatarColor {
  if (!username) return AVATAR_PALETTE[0];
  const clean = username.replace(/^@/, '').toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
}

/**
 * Generates an SVG Data URI representing a clean letter avatar
 */
export function generateLetterAvatar(char: string, bgHex: string, secondaryHex?: string): string {
  const display = (char || 'N').slice(0, 2).toUpperCase();
  const fill = secondaryHex
    ? `<defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgHex}" />
          <stop offset="100%" stop-color="${secondaryHex}" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="28" fill="url(#g)" />`
    : `<rect width="128" height="128" rx="28" fill="${bgHex}" />`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
    ${fill}
    <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="64" letter-spacing="-1">${display}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Generate standard SVG data URI for username
 */
export function generateStandardAvatar(username: string): string {
  const initial = getDefaultAvatarInitial(username);
  const color = getAvatarColorForUsername(username);
  return generateLetterAvatar(initial, color.bgHex);
}
