/**
 * Accent palettes.
 *
 * The base token bindings (`colors.ts`) are intentionally near-neutral:
 * light mode's primary is graphite. A palette swaps only the accent-bearing
 * keys, so surfaces, text, and semantic colors stay identical across
 * choices — the app keeps one layout and one contrast contract while the
 * user picks the tint that matches their taste.
 *
 * Pure data. No React / Paper / MobX imports.
 */
import type {Mode, TokenColors} from './types';

export type AccentPaletteId = 'graphite' | 'lavender' | 'emerald' | 'ocean';

export const ACCENT_PALETTE_IDS: readonly AccentPaletteId[] = [
  'graphite',
  'lavender',
  'emerald',
  'ocean',
];

type PaletteBindings = {
  light: Partial<TokenColors>;
  dark: Partial<TokenColors>;
};

/**
 * `graphite` carries no overrides: it renders the untouched base tokens and
 * is the migration-safe default for every existing install.
 */
export const ACCENT_PALETTES: Record<AccentPaletteId, PaletteBindings> = {
  graphite: {light: {}, dark: {}},
  lavender: {
    light: {
      primary: '#5B4BD6',
      onPrimary: '#FFFFFF',
      primaryContainer: '#E4E0FF',
      onPrimaryContainer: '#211A5C',
      inversePrimary: '#C9C2FF',
      secondaryContainer: '#EAE7FF',
    },
    dark: {
      primary: '#C9C2FF',
      onPrimary: '#211A5C',
      primaryContainer: '#443A9E',
      onPrimaryContainer: '#E7E2FF',
      inversePrimary: '#5B4BD6',
      secondaryContainer: '#3A3468',
    },
  },
  emerald: {
    light: {
      primary: '#0F7A5A',
      onPrimary: '#FFFFFF',
      primaryContainer: '#CDEFE1',
      onPrimaryContainer: '#063326',
      inversePrimary: '#7FDCC0',
      secondaryContainer: '#DFF3EA',
    },
    dark: {
      primary: '#7FDCC0',
      onPrimary: '#04241A',
      primaryContainer: '#0E5A44',
      onPrimaryContainer: '#D6F5EA',
      inversePrimary: '#0F7A5A',
      secondaryContainer: '#1C3B31',
    },
  },
  ocean: {
    light: {
      primary: '#0B5FA5',
      onPrimary: '#FFFFFF',
      primaryContainer: '#D3E6F8',
      onPrimaryContainer: '#04263F',
      inversePrimary: '#9CCBF5',
      secondaryContainer: '#E1EEF9',
    },
    dark: {
      primary: '#9CCBF5',
      onPrimary: '#052033',
      primaryContainer: '#0D4E7E',
      onPrimaryContainer: '#DCEBFB',
      inversePrimary: '#0B5FA5',
      secondaryContainer: '#1B3242',
    },
  },
};

/** Palette overrides for one mode; empty for `graphite`. */
export function accentOverrides(
  palette: AccentPaletteId,
  mode: Mode,
): Partial<TokenColors> {
  return ACCENT_PALETTES[palette]?.[mode] ?? {};
}
