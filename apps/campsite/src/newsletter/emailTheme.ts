import { escapeHtml } from "../prerender/head";

/**
 * The design system's light-mode tokens, resolved to the literal values an
 * email needs: a mail client loads no stylesheet, so every style is inline.
 * Keyed by the token's own name so `emailTheme.test.ts` can resolve each one
 * from the tokens' CSS and hold the two equal, and hold the confirmation
 * email's copy in `infra/lambda/newsletter-api/accept.mjs` to the same values.
 *
 * No font file is loaded. A reader without Nunito installed gets the stack's
 * system sans, because a font fetched from a server would log every open.
 */
export const EMAIL_TOKENS = {
  "--brand-bg": "#f5f9e9",
  "--brand-surface": "#ffffff",
  "--brand-subtle": "#dde9d4",
  "--brand-solid": "#5a9367",
  "--brand-text": "#3f4b3b",
  "--brand-text-muted": "#5f7356",
  "--brand-text-on-brand": "#ffffff",
  "--brand-link": "#4c7d57",
  "--brand-border": "#d3dacb",
  "--brand-border-strong": "#b3bdaa",
  "--brand-control-close": "#c0492f",
  "--brand-control-minimise": "#f2913a",
  "--brand-control-maximise": "#5a9367",
  "--shadow-hard-color": "rgba(43, 51, 39, 0.9)",
  "--shadow-bevel-light": "rgba(255, 255, 255, 0.85)",
  "--shadow-bevel-dark": "rgba(43, 51, 39, 0.35)",
  "--font-sans": `"Nunito", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  "--font-text": `"Nunito Sans Variable", "Nunito Sans", "Nunito", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
} as const;

/** For a `style` attribute, which is double-quoted. */
export const fontStack = (stack: string): string => stack.replace(/"/g, "'");

const T = EMAIL_TOKENS;
const BEVEL_OUT = `box-shadow:inset 1px 1px 0 0 ${T["--shadow-bevel-light"]},inset -1px -1px 0 0 ${T["--shadow-bevel-dark"]};`;

const light = (colour: string): string =>
  `<td style="width:14px;height:14px;background:${colour};border:1px solid ${T["--brand-border-strong"]};font-size:0;line-height:0;">&nbsp;</td><td style="width:4px;font-size:0;line-height:0;">&nbsp;</td>`;

/**
 * An email dressed as a CatOS window: the title bar and its three lights, the
 * 2px frame and the hard shadow of an inline `Window`. Tables, because that is
 * all a mail client lays out reliably; a client that drops `box-shadow` keeps
 * the frame and loses only the shadow and bevels. `body` is trusted markup,
 * already escaped. The confirmation email builds the same frame in
 * `accept.mjs`, which cannot import this.
 */
export function windowEmail({ title, body }: { title: string; body: string }): string {
  const page = `margin:0;padding:0;background:${T["--brand-bg"]};`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
</head>
<body style="${page}font-family:${fontStack(T["--font-text"])};color:${T["--brand-text"]};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${page}"><tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:${T["--brand-surface"]};border:2px solid ${T["--brand-border-strong"]};box-shadow:4px 4px 0 0 ${T["--shadow-hard-color"]};">
<tr><td style="background:${T["--brand-subtle"]};border-bottom:2px solid ${T["--brand-border-strong"]};padding:7px 8px;${BEVEL_OUT}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="width:54px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr>${light(T["--brand-control-close"])}${light(T["--brand-control-minimise"])}${light(T["--brand-control-maximise"])}</tr></table></td>
<td style="font-family:${fontStack(T["--font-sans"])};text-align:center;color:${T["--brand-text"]};font-size:14px;line-height:1.4;font-weight:700;">${escapeHtml(title)}</td>
<td style="width:54px;">&nbsp;</td>
</tr></table>
</td></tr>
${body}
</table>
</td></tr></table>
</body>
</html>
`;
}
