// What the endpoint accepts and what it says back, kept free of the AWS SDK so
// it can be tested. This is the whole security surface of a public
// unauthenticated endpoint, so it is the part that has to be exercised.

/** Past any real form post, and a bound on what one request costs to parse. */
export const MAX_BODY_BYTES = 4096;

/** RFC 5321's ceiling on an address. */
export const EMAIL_LIMIT = 254;

/**
 * Deliberately not a validator: anything with one `@` and a dot after it is
 * worth sending a confirmation to, and the confirmation is the real check.
 */
const LOOKS_LIKE_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** 24 random bytes as base64url, which is what `newToken` in index.mjs makes. */
const TOKEN = /^[A-Za-z0-9_-]{32}$/;

/**
 * The pages the endpoint redirects a plain form post to. The site renders
 * one page per name under `/blog/subscribe/`; `noticesParity.test.ts` there holds
 * the two lists together.
 */
export const NOTICES = Object.freeze({
  checkInbox: "check-your-inbox",
  confirmed: "confirmed",
  unsubscribed: "unsubscribed",
  linkExpired: "link-expired",
  notAccepted: "not-accepted",
});

export const noticePath = (name) => `/blog/subscribe/${name}.html`;

function parseBody(raw, contentType) {
  if (typeof raw !== "string") return null;
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return null;
  const type = (contentType ?? "").toLowerCase();
  if (type.includes("application/json")) {
    try {
      const parsed = JSON.parse(raw);
      return parsed !== null && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }
  return Object.fromEntries(new URLSearchParams(raw));
}

/**
 * Returns `{ ok: false }` with no reason attached: every rejection is answered
 * identically, so a bot learns nothing about which check it tripped.
 */
export function acceptSubscribe(raw, contentType) {
  const payload = parseBody(raw, contentType);
  if (!payload) return { ok: false };

  const { email, trap } = payload;
  // The honeypot: a field no person is shown, so anything in it was not typed.
  if (typeof trap !== "string" || trap !== "") return { ok: false };

  if (typeof email !== "string") return { ok: false };
  const address = email.trim().toLowerCase();
  if (address.length > EMAIL_LIMIT || !LOOKS_LIKE_EMAIL.test(address)) return { ok: false };

  return { ok: true, email: address };
}

/** The token on a confirm or unsubscribe link, or `undefined` for anything else. */
export function acceptToken(value) {
  return typeof value === "string" && TOKEN.test(value) ? value : undefined;
}

/** The token on an unsubscribe POST: our own page puts it in the body, a mail
 *  client's one-click POST leaves it in the query string. */
export function unsubscribeToken(raw, contentType, query) {
  const payload = parseBody(raw, contentType);
  return acceptToken(payload?.t) ?? acceptToken(query?.t);
}

/**
 * A fetch from the page says so in its headers; a plain form post does not,
 * and gets a redirect to a page it can show.
 */
export function wantsJson(headers = {}) {
  const lower = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), String(value)]),
  );
  return (
    (lower["content-type"] ?? "").includes("application/json") ||
    (lower["accept"] ?? "").includes("application/json")
  );
}

const escapeHtml = (text) =>
  String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/**
 * The page behind the footer's unsubscribe link. Mail security products fetch
 * every link in a message, so a GET must change nothing; the button's POST is
 * what unsubscribes. Rendered here rather than on the site because the token
 * has to travel from the link into the form without JavaScript.
 */
export function unsubscribePage({ token, siteName }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Unsubscribe from ${escapeHtml(siteName)}</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; font: 16px/1.5 system-ui, sans-serif; background: #f4efe6; color: #2b2a26; }
  main { max-width: 28rem; padding: 2rem; }
  button { font: inherit; padding: 0.6rem 1.2rem; border: 2px solid #2b2a26; border-radius: 999px; background: #2b2a26; color: #f4efe6; cursor: pointer; }
</style>
</head>
<body>
<main>
<h1>Need to take a break from my rambling?</h1>
<p>Press the button and I'll stop emailing you.</p>
<form method="post">
<input type="hidden" name="t" value="${escapeHtml(token)}">
<button type="submit">Unsubscribe</button>
</form>
</main>
</body>
</html>
`;
}

/**
 * The site's design tokens as an email needs them, inline. The campsite's
 * `src/newsletter/emailTheme.ts` holds the same names, checked against the
 * design system, and its test holds this copy equal to that one.
 */
export const EMAIL_TOKENS = Object.freeze({
  "--brand-bg": "#f5f9e9",
  "--brand-surface": "#ffffff",
  "--brand-subtle": "#dde9d4",
  "--brand-solid": "#5a9367",
  "--brand-text": "#3f4b3b",
  "--brand-text-muted": "#5f7356",
  "--brand-text-on-brand": "#ffffff",
  "--brand-link": "#4c7d57",
  "--brand-border-strong": "#b3bdaa",
  "--brand-control-close": "#c0492f",
  "--brand-control-minimise": "#f2913a",
  "--brand-control-maximise": "#5a9367",
  "--shadow-hard-color": "rgba(43, 51, 39, 0.9)",
  "--shadow-bevel-light": "rgba(255, 255, 255, 0.85)",
  "--shadow-bevel-dark": "rgba(43, 51, 39, 0.35)",
  "--font-sans": `"Nunito", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  "--font-text": `"Nunito Sans Variable", "Nunito Sans", "Nunito", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
});

const T = EMAIL_TOKENS;
const fontStack = (stack) => stack.replaceAll('"', "'");
const SANS = `font-family:${fontStack(T["--font-sans"])};`;
const TEXT = `font-family:${fontStack(T["--font-text"])};`;
const BEVEL_OUT = `box-shadow:inset 1px 1px 0 0 ${T["--shadow-bevel-light"]},inset -1px -1px 0 0 ${T["--shadow-bevel-dark"]};`;

const light = (colour) =>
  `<td style="width:14px;height:14px;background:${colour};border:1px solid ${T["--brand-border-strong"]};font-size:0;line-height:0;">&nbsp;</td><td style="width:4px;font-size:0;line-height:0;">&nbsp;</td>`;

/**
 * An email dressed as a CatOS window, the same frame as the newsletter's
 * `windowEmail` in the campsite, which this cannot import. `body` is trusted,
 * already-escaped table rows.
 */
function windowEmail({ title, body }) {
  const page = `margin:0;padding:0;background:${T["--brand-bg"]};`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
</head>
<body style="${page}${TEXT}color:${T["--brand-text"]};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${page}"><tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${T["--brand-surface"]};border:2px solid ${T["--brand-border-strong"]};box-shadow:4px 4px 0 0 ${T["--shadow-hard-color"]};">
<tr><td style="background:${T["--brand-subtle"]};border-bottom:2px solid ${T["--brand-border-strong"]};padding:7px 8px;${BEVEL_OUT}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="width:54px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr>${light(T["--brand-control-close"])}${light(T["--brand-control-minimise"])}${light(T["--brand-control-maximise"])}</tr></table></td>
<td style="${SANS}text-align:center;color:${T["--brand-text"]};font-size:14px;line-height:1.4;font-weight:700;">${escapeHtml(title)}</td>
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

/** The confirmation email. Nothing a reader typed reaches it. */
export function confirmationMail({ link, siteName }) {
  const subject = `Confirm your subscription to ${siteName}`;
  const opening = `Someone - hopefully you! - asked to hear about any new posts from ${siteName} via their inbox.`;
  const confirm = "Click to let me know you really mean it!";
  const fallback = "Button not working? Paste this into your browser:";
  const closing = "If you have no idea what I'm on about, ignore this email.";
  const href = escapeHtml(link);
  const muted = `${TEXT}color:${T["--brand-text-muted"]};font-size:14px;line-height:1.55;`;
  return {
    subject,
    text: [opening, "", confirm, link, "", closing].join("\n"),
    html: windowEmail({
      title: subject,
      body: `<tr><td style="padding:36px 40px 32px;text-align:center;">
<p style="${TEXT}margin:0;color:${T["--brand-text"]};font-size:17px;line-height:1.62;">${escapeHtml(opening)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:28px auto;"><tr><td>
<a href="${href}" style="${SANS}display:inline-block;padding:12px 24px;background:${T["--brand-solid"]};color:${T["--brand-text-on-brand"]};font-size:17px;font-weight:700;text-decoration:none;border:1px solid ${T["--brand-border-strong"]};${BEVEL_OUT}">${confirm}</a>
</td></tr></table>
<p style="${muted}margin:0 0 4px;">${fallback}</p>
<p style="${muted}margin:0 0 24px;word-break:break-all;"><a href="${href}" style="color:${T["--brand-link"]};">${href}</a></p>
<p style="${muted}margin:0;">${closing}</p>
</td></tr>`,
    }),
  };
}
