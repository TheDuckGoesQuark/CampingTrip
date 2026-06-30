/**
 * Design tokens — the single source of truth for the jordanscamp look.
 *
 * Framework-agnostic on purpose: Mantine apps build a theme from these (see
 * theme.ts), and non-Mantine surfaces (the campsite R3F scene, the PhotoBroom
 * overlay's shadow-DOM inline styles) can import the raw values directly via
 * `@jordanscamp/theme/tokens` without pulling in Mantine.
 */

/** Brand orange as a Mantine-style 10-step tuple (index 0 lightest → 9 darkest). */
export const orange = [
  '#fff8e1',
  '#ffefcc',
  '#ffdd9b',
  '#ffca64',
  '#ffba38',
  '#ffb01b',
  '#ffab09',
  '#e39500',
  '#ca8400',
  '#af7100',
] as const;

/** Dark "surface" scale for panels/overlays (base → raised → border). */
export const surface = {
  page: '#0a0612',
  base: '#1a1b1e',
  raised: '#25262b',
  border: '#373a40',
} as const;

export const text = {
  primary: '#e9ecef',
  dimmed: '#909296',
} as const;

/** Semantic accents used by the swipe/triage UI and beyond. */
export const accent = {
  brand: '#ffb347',
  keep: '#40c057',
  trash: '#fa5252',
  neutral: '#5c5f66',
  info: '#4dabf7',
} as const;

export const fontFamily =
  'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export const radius = {
  default: 'md',
} as const;

/** Everything in one object, for ergonomic `import { tokens }` consumers. */
export const tokens = { orange, surface, text, accent, fontFamily, radius } as const;
