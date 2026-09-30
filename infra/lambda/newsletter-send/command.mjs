// What CI may ask of the send function, kept free of the SDK so it can be
// tested. Anything else is refused before a table or queue is touched.

/** An issue slug: what `slugify` in the site makes of a subject line. */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const MODES = Object.freeze(["test", "send", "status"]);

/** `{ ok: true, issue, mode }`, or `{ ok: false, error }` naming what was wrong. */
export function parseCommand(event) {
  if (event === null || typeof event !== "object") return { ok: false, error: "No command." };
  const { issue, mode } = event;
  if (typeof issue !== "string" || issue.length > 80 || !SLUG.test(issue)) {
    return { ok: false, error: "issue must be a slug." };
  }
  if (!MODES.includes(mode))
    return { ok: false, error: `mode must be one of ${MODES.join(", ")}.` };
  return { ok: true, issue, mode };
}

/** The addresses a test send goes to, from a comma-separated setting. */
export function recipientsFrom(setting) {
  return (setting ?? "")
    .split(",")
    .map((address) => address.trim().toLowerCase())
    .filter((address) => address !== "");
}

/**
 * One queue message per recipient. A test carries no token, since it never
 * unsubscribes anyone, and the worker reads the flag rather than the absence.
 */
export function messageFor({ issue, email, unsubscribeToken, test = false }) {
  return test ? { issue, email, test: true } : { issue, email, unsubscribeToken };
}

/** SQS takes ten entries per batch call. */
export function batches(items, size = 10) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
