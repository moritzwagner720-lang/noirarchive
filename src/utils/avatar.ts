/**
 * Avatar generation and customization utilities for Noir Archive
 * Supports standard letter avatars with vibrant colorful backgrounds,
 * SVG data URI encoding, and preset studio avatars.
 */

export interface ColorOption {
  id: string;
  name: string;
  hex: string;
  secondaryHex: string;
  gradient: string;
}

export const COLOR_PALETTE: ColorOption[] = [
  { id: 'violet', name: 'Vivid Violet', hex: '#8b5cf6', secondaryHex: '#6d28d9', gradient: 'from-[#8b5cf6] to-[#6d28d9]' },
  { id: 'pink', name: 'Electric Pink', hex: '#ec4899', secondaryHex: '#be185d', gradient: 'from-[#ec4899] to-[#be185d]' },
  { id: 'cyan', name: 'Cyber Cyan', hex: '#06b6d4', secondaryHex: '#0e7490', gradient: 'from-[#06b6d4] to-[#0e7490]' },
  { id: 'emerald', name: 'Neon Emerald', hex: '#10b981', secondaryHex: '#047857', gradient: 'from-[#10b981] to-[#047857]' },
  { id: 'amber', name: 'Golden Amber', hex: '#f59e0b', secondaryHex: '#b45309', gradient: 'from-[#f59e0b] to-[#b45309]' },
  { id: 'crimson', name: 'Ruby Crimson', hex: '#ef4444', secondaryHex: '#b91c1c', gradient: 'from-[#ef4444] to-[#b91c1c]' },
  { id: 'blue', name: 'Royal Cobalt', hex: '#3b82f6', secondaryHex: '#1d4ed8', gradient: 'from-[#3b82f6] to-[#1d4ed8]' },
  { id: 'teal', name: 'Oceanic Teal', hex: '#14b8a6', secondaryHex: '#0f766e', gradient: 'from-[#14b8a6] to-[#0f766e]' },
  { id: 'orange', name: 'Sunset Coral', hex: '#f97316', secondaryHex: '#c2410c', gradient: 'from-[#f97316] to-[#c2410c]' },
  { id: 'indigo', name: 'Deep Indigo', hex: '#6366f1', secondaryHex: '#4338ca', gradient: 'from-[#6366f1] to-[#4338ca]' },
  { id: 'fuchsia', name: 'Hyper Fuchsia', hex: '#d946ef', secondaryHex: '#a21caf', gradient: 'from-[#d946ef] to-[#a21caf]' },
  { id: 'lime', name: 'Acid Lime', hex: '#84cc16', secondaryHex: '#4d7c0f', gradient: 'from-[#84cc16] to-[#4d7c0f]' },
];

export const PRESET_AVATARS = [
  {
    id: 'preset-arch',
    title: 'Architectural Portrait',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'preset-darkroom',
    title: 'Darkroom Chiaroscuro',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'preset-nocturnal',
    title: 'Nocturnal Street Observer',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'preset-minimal',
    title: 'Minimalist Monolith',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'preset-fashion',
    title: 'Sculptural Fashion',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'preset-camera',
    title: 'Rangefinder Silhouette',
    url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
  },
];

/**
 * Extracts the initial for a standard profile avatar.
 * User requirement: "for example my name is 'k3nanbaba' then is the first letter 3"
 */
export function getDefaultAvatarInitial(username: string): string {
  if (!username) return 'N';
  const clean = username.replace(/^@/, '').trim();

  // If username is "k3nanbaba" (or matches leet-styled k3nan), specifically return '3'
  if (clean.toLowerCase() === 'k3nanbaba' || clean.toLowerCase().startsWith('k3nan')) {
    return '3';
  }

  // If first character is alphanumeric, return it capitalized
  const firstChar = clean.charAt(0);
  if (firstChar) {
    return firstChar.toUpperCase();
  }

  return 'N';
}

/**
 * Deterministically picks a vibrant colorful color for a username
 */
export function getRandomColorForUsername(username: string): ColorOption {
  if (!username) return COLOR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

/**
 * Generates an SVG Data URI representing a high-resolution circular letter avatar
 * with a colorful background.
 */
export function generateLetterAvatar(
  char: string,
  bgColor: string,
  secondaryColor?: string
): string {
  const displayChar = (char || 'N').slice(0, 2).toUpperCase();
  const bgFill = secondaryColor
    ? `<defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgColor}" />
          <stop offset="100%" stop-color="${secondaryColor}" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="64" fill="url(#grad)" />`
    : `<rect width="128" height="128" rx="64" fill="${bgColor}" />`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
    ${bgFill}
    <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="800" font-size="62" letter-spacing="-1">${displayChar}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Generates the standard default profile picture for a username:
 * First letter/number (e.g. '3' for 'k3nanbaba') + random colorful background
 */
export function generateStandardAvatar(username: string): string {
  const initial = getDefaultAvatarInitial(username);
  const color = getRandomColorForUsername(username);
  return generateLetterAvatar(initial, color.hex, color.secondaryHex);
}
