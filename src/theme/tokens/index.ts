/**
 * Design tokens entry point (Phase 1).
 *
 * Pure data + types. No React, no Paper, no MobX imports here. The only
 * runtime dependency is `colorUtils` (pure utility — not React/Paper/MobX).
 *
 * Mode is selected by binding (light vs dark), not by mutation. Locale
 * fallback (Fraunces → Inter for non-Latin scripts) lives in the theme
 * builder (`useTheme()`) so components remain locale-agnostic.
 */
import {lightColors, darkColors} from './colors';
import {accentOverrides, type AccentPaletteId} from './palettes';
import {radius} from './radius';
import {spacing} from './spacing';
import {stroke} from './stroke';
import {typography} from './typography';

import type {Mode, Tokens} from './types';

export const lightTokens: Tokens = {
  colors: lightColors,
  typography,
  spacing,
  radius,
  stroke,
};

export const darkTokens: Tokens = {
  colors: darkColors,
  typography,
  spacing,
  radius,
  stroke,
};

/**
 * Returns the resolved Tokens for a given mode and accent palette.
 *
 * With `graphite` (or no palette) this returns the shared base object
 * unchanged, so callers that never touch palettes keep identical
 * references. A real palette returns a new object with only the
 * accent-bearing color keys overridden.
 */
export function resolveTokens(
  mode: Mode,
  palette: AccentPaletteId = 'graphite',
): Tokens {
  const base = mode === 'dark' ? darkTokens : lightTokens;
  const overrides = accentOverrides(palette, mode);
  if (Object.keys(overrides).length === 0) {
    return base;
  }
  return {...base, colors: {...base.colors, ...overrides}};
}

export type {
  Mode,
  Tokens,
  TokenColors,
  TokenTypography,
  TokenSpacing,
  TokenRadius,
  TokenStroke,
  TypographyStyle,
} from './types';

export {
  FONT_FAMILIES,
  NON_LATIN_LOCALES,
  typography,
  typographyForLocale,
  resolveTypographyForLocale,
} from './typography';

export {lightColors, darkColors} from './colors';
export {
  ACCENT_PALETTES,
  ACCENT_PALETTE_IDS,
  accentOverrides,
  type AccentPaletteId,
} from './palettes';
export {spacing} from './spacing';
export {radius} from './radius';
export {stroke} from './stroke';
