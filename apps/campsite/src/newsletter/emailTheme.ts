/**
 * The design system's light-mode tokens, resolved to the literal values an
 * email needs: a mail client loads no stylesheet, so every style is inline.
 * Keyed by the token's own name so `emailTheme.test.ts` can resolve each one
 * from the tokens' CSS and hold the two equal.
 *
 * No font file is loaded. A reader without Nunito installed gets the stack's
 * system sans, because a font fetched from a server would log every open.
 */
export const EMAIL_TOKENS = {
  "--brand-bg": "#f5f9e9",
  "--brand-surface": "#ffffff",
  "--brand-text": "#3f4b3b",
  "--brand-text-muted": "#5f7356",
  "--brand-link": "#4c7d57",
  "--brand-border": "#d3dacb",
  "--brand-border-strong": "#b3bdaa",
  "--font-sans": `"Nunito", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  "--font-text": `"Nunito Sans Variable", "Nunito Sans", "Nunito", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  "--radius-l": "16px",
} as const;

/** For a `style` attribute, which is double-quoted. */
export const fontStack = (stack: string): string => stack.replace(/"/g, "'");
