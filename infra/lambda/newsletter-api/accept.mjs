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
<h1>Leave the list?</h1>
<p>Press the button and no more issues of ${escapeHtml(siteName)} will reach this address.</p>
<form method="post">
<input type="hidden" name="t" value="${escapeHtml(token)}">
<button type="submit">Unsubscribe</button>
</form>
</main>
</body>
</html>
`;
}

/** The confirmation email. Nothing a reader typed reaches it. */
export function confirmationMail({ link, siteName }) {
  return {
    subject: `Confirm your subscription to ${siteName}`,
    text: [
      `Someone, probably you, asked for new posts from ${siteName} by email.`,
      "",
      "Click to confirm, and nothing is sent until you do:",
      link,
      "",
      "If that wasn't you, ignore this and the request expires on its own.",
    ].join("\n"),
    html: `<p>Someone, probably you, asked for new posts from ${escapeHtml(siteName)} by email.</p>
<p><a href="${escapeHtml(link)}">Confirm the subscription</a>, and nothing is sent until you do.</p>
<p>If that wasn't you, ignore this and the request expires on its own.</p>
`,
  };
}
