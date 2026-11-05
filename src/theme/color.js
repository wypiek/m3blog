// Dynamic color: derive the full M3 color-role set from a single seed color
// using Google's Material Color Utilities (the same HCT engine Android uses).
import {
  Hct,
  argbFromHex,
  hexFromArgb,
  MaterialDynamicColors as M,
  SchemeContent,
  SchemeExpressive,
  SchemeFidelity,
  SchemeMonochrome,
  SchemeNeutral,
  SchemeRainbow,
  SchemeFruitSalad,
  SchemeTonalSpot,
  SchemeVibrant,
} from '@material/material-color-utilities';

export const VARIANTS = {
  tonalSpot: SchemeTonalSpot,
  vibrant: SchemeVibrant,
  expressive: SchemeExpressive,
  content: SchemeContent,
  fidelity: SchemeFidelity,
  neutral: SchemeNeutral,
  monochrome: SchemeMonochrome,
  rainbow: SchemeRainbow,
  fruitSalad: SchemeFruitSalad,
};

const ROLES = [
  'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer', 'inversePrimary',
  'primaryFixed', 'primaryFixedDim', 'onPrimaryFixed', 'onPrimaryFixedVariant',
  'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer',
  'secondaryFixed', 'secondaryFixedDim', 'onSecondaryFixed', 'onSecondaryFixedVariant',
  'tertiary', 'onTertiary', 'tertiaryContainer', 'onTertiaryContainer',
  'tertiaryFixed', 'tertiaryFixedDim', 'onTertiaryFixed', 'onTertiaryFixedVariant',
  'error', 'onError', 'errorContainer', 'onErrorContainer',
  'background', 'onBackground', 'surface', 'onSurface', 'surfaceVariant', 'onSurfaceVariant',
  'surfaceDim', 'surfaceBright', 'surfaceContainerLowest', 'surfaceContainerLow',
  'surfaceContainer', 'surfaceContainerHigh', 'surfaceContainerHighest',
  'inverseSurface', 'inverseOnSurface', 'outline', 'outlineVariant', 'shadow', 'scrim', 'surfaceTint',
];

const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** Returns `{ roleName: '#rrggbb' }` for one brightness. */
export function colorScheme(seed, { dark = false, variant = 'tonalSpot', contrast = 0 } = {}) {
  if (!/^#?[0-9a-f]{6}$/i.test(seed)) throw new Error(`theme.seedColor must be a hex color like "#6750A4", got "${seed}"`);
  const Scheme = VARIANTS[variant];
  if (!Scheme) throw new Error(`Unknown theme.variant "${variant}". Use one of: ${Object.keys(VARIANTS).join(', ')}`);
  const scheme = new Scheme(Hct.fromInt(argbFromHex(seed.startsWith('#') ? seed : `#${seed}`)), dark, contrast);
  return Object.fromEntries(ROLES.map((role) => [role, hexFromArgb(M[role].getArgb(scheme))]));
}

export function colorCssVars(scheme, indent = '  ') {
  return Object.entries(scheme)
    .map(([role, hex]) => `${indent}--md-sys-color-${kebab(role)}: ${hex};`)
    .join('\n');
}
