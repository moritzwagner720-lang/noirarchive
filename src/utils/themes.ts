import { ThemeDefinition, ThemeId } from '../types';

export const CHRISTMAS_BACKGROUND_IMAGE = '/assets/themes/christmas-bg.jpg';
export const HALLOWEEN_BACKGROUND_IMAGE = '/assets/themes/halloween-bg.jpg';

export const THEMES: ThemeDefinition[] = [
  {
    id: 'graphite',
    name: 'Graphite',
    type: 'standard',
    description: 'Clean modern Discord-inspired dark charcoal with crisp slate accents.',
    accentHex: '#5865f2',
    accentHoverHex: '#4752c4',
    accentText: '#ffffff',
    bgBase: '#1e1f22',
    bgSurface: '#2b2d31',
    bgElevated: '#313338',
    borderColor: '#383a40',
    previewColors: ['#1e1f22', '#2b2d31', '#5865f2'],
  },
  {
    id: 'midnight',
    name: 'Midnight Blue',
    type: 'standard',
    description: 'Deep navy nightfall with royal cobalt and vibrant electric blue.',
    accentHex: '#3b82f6',
    accentHoverHex: '#2563eb',
    accentText: '#ffffff',
    bgBase: '#0b1120',
    bgSurface: '#111827',
    bgElevated: '#1f2937',
    borderColor: '#283548',
    previewColors: ['#0b1120', '#111827', '#3b82f6'],
  },
  {
    id: 'arctic',
    name: 'Arctic Ice',
    type: 'standard',
    description: 'Glacial frosted glass with stark cold cyan and crisp steel tones.',
    accentHex: '#06b6d4',
    accentHoverHex: '#0891b2',
    accentText: '#ffffff',
    bgBase: '#0a131a',
    bgSurface: '#0f1d27',
    bgElevated: '#162836',
    borderColor: '#22384a',
    previewColors: ['#0a131a', '#0f1d27', '#06b6d4'],
  },
  {
    id: 'purple',
    name: 'Purple',
    type: 'standard',
    description: 'Rich royal amethyst with deep plum panels and electric violet highlights.',
    accentHex: '#8b5cf6',
    accentHoverHex: '#7c3aed',
    accentText: '#ffffff',
    bgBase: '#100c1e',
    bgSurface: '#191330',
    bgElevated: '#241c42',
    borderColor: '#34285c',
    previewColors: ['#100c1e', '#191330', '#8b5cf6'],
  },
  {
    id: 'emerald',
    name: 'Emerald',
    type: 'standard',
    description: 'Nocturnal jade and deep forest slate with bright mint emerald accents.',
    accentHex: '#10b981',
    accentHoverHex: '#059669',
    accentText: '#061a12',
    bgBase: '#08140e',
    bgSurface: '#0f2219',
    bgElevated: '#163326',
    borderColor: '#204736',
    previewColors: ['#08140e', '#0f2219', '#10b981'],
  },
  {
    id: 'crimson',
    name: 'Crimson',
    type: 'standard',
    description: 'Dark obsidian ruby with velvet charcoal and vibrant crimson red.',
    accentHex: '#ef4444',
    accentHoverHex: '#dc2626',
    accentText: '#ffffff',
    bgBase: '#14080a',
    bgSurface: '#210e12',
    bgElevated: '#30141a',
    borderColor: '#461d25',
    previewColors: ['#14080a', '#210e12', '#ef4444'],
  },
  {
    id: 'rose',
    name: 'Rose',
    type: 'standard',
    description: 'Sleek neon magenta and midnight berry with vivid coral rose accents.',
    accentHex: '#f43f5e',
    accentHoverHex: '#e11d48',
    accentText: '#ffffff',
    bgBase: '#140810',
    bgSurface: '#220d1c',
    bgElevated: '#33132a',
    borderColor: '#491b3c',
    previewColors: ['#140810', '#220d1c', '#f43f5e'],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    type: 'standard',
    description: 'Deep maritime trench with dark cyan slate and radiant aqua highlights.',
    accentHex: '#0ea5e9',
    accentHoverHex: '#0284c7',
    accentText: '#ffffff',
    bgBase: '#071219',
    bgSurface: '#0c1e29',
    bgElevated: '#122c3c',
    borderColor: '#1c3e54',
    previewColors: ['#071219', '#0c1e29', '#0ea5e9'],
  },
  {
    id: 'amber',
    name: 'Amber',
    type: 'standard',
    description: 'Warm roasted espresso with deep charcoal and golden amber honey glow.',
    accentHex: '#f59e0b',
    accentHoverHex: '#d97706',
    accentText: '#180f03',
    bgBase: '#140e06',
    bgSurface: '#21180b',
    bgElevated: '#312311',
    borderColor: '#463219',
    previewColors: ['#140e06', '#21180b', '#f59e0b'],
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    type: 'standard',
    description: 'Ultra-minimalist stark pitch black, gunmetal cards, and pure silver white.',
    accentHex: '#e5e7eb',
    accentHoverHex: '#f3f4f6',
    accentText: '#111827',
    bgBase: '#0d0d0e',
    bgSurface: '#171719',
    bgElevated: '#222226',
    borderColor: '#2e2e34',
    previewColors: ['#0d0d0e', '#171719', '#e5e7eb'],
  },
  {
    id: 'christmas',
    name: 'Christmas Theme',
    type: 'seasonal',
    description: 'Festive holiday atmosphere with winter pine trees under a glowing full moon and soft falling snow.',
    accentHex: '#dc2626',
    accentHoverHex: '#b91c1c',
    accentText: '#ffffff',
    bgBase: '#07160d',
    bgSurface: '#0e2417',
    bgElevated: '#153623',
    borderColor: '#204d32',
    previewColors: ['#07160d', '#153623', '#dc2626'],
    backgroundImage: CHRISTMAS_BACKGROUND_IMAGE,
  },
  {
    id: 'halloween',
    name: 'Halloween Theme',
    type: 'seasonal',
    description: 'Spooky nocturnal midnight sky, full moon silhouette, dark horizon and barren trees with floating embers.',
    accentHex: '#ff6b00',
    accentHoverHex: '#ea580c',
    accentText: '#000000',
    bgBase: '#0d0714',
    bgSurface: '#160d22',
    bgElevated: '#211433',
    borderColor: '#372054',
    previewColors: ['#0d0714', '#211433', '#ff6b00'],
    backgroundImage: HALLOWEEN_BACKGROUND_IMAGE,
  },
];

export const DEFAULT_THEME_ID: ThemeId = 'graphite';

export function getTheme(id: string | undefined): ThemeDefinition {
  const match = THEMES.find(t => t.id === id);
  return match || THEMES[0];
}

export const getThemeById = getTheme;

export function isSeasonalTheme(id: string | undefined): boolean {
  const t = THEMES.find(th => th.id === id);
  return t ? t.type === 'seasonal' : false;
}

export function applyThemeToDocument(themeId: ThemeId): void {
  if (typeof document === 'undefined') return;
  const t = getTheme(themeId);
  const root = document.documentElement;

  root.style.setProperty('--color-accent', t.accentHex);
  root.style.setProperty('--color-accent-hover', t.accentHoverHex);
  root.style.setProperty('--color-accent-text', t.accentText);
  root.style.setProperty('--color-bg-base', t.bgBase);
  root.style.setProperty('--color-bg-surface', t.bgSurface);
  root.style.setProperty('--color-bg-elevated', t.bgElevated);
  root.style.setProperty('--color-border', t.borderColor);

  const secondaryAccent =
    t.id === 'christmas' ? '#f59e0b' : t.id === 'halloween' ? '#a855f7' : '#949ba4';
  root.style.setProperty('--color-secondary-accent', secondaryAccent);

  if (t.backgroundImage) {
    root.style.setProperty('--theme-bg-image', `url(${t.backgroundImage})`);
  } else {
    root.style.removeProperty('--theme-bg-image');
  }

  document.body.style.backgroundColor = t.bgBase;
  document.body.style.color = '#f3f4f6';
  root.setAttribute('data-theme', t.id);
}
