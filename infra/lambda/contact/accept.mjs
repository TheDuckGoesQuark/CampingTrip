// Whether a request is worth publishing, and what to publish. Split from the
// handler so it can be tested without the AWS SDK or a Lambda runtime — this is
// the whole security surface of a public unauthenticated endpoint, so it is the
// part that has to be exercised.

export const MESSAGE_LIMIT = 4000;

export const SUBJECT_LIMIT = 200;

/** Mirrors the form's own floor; see `apps/campsite/.../submitFeedback.ts`. */
export const MIN_DWELL_MS = 2000;

/** Past any real note, and a bound on what one request can cost to parse. */
export const MAX_BODY_BYTES = 8192;

/**
 * Deliberately not a validator — anything with an `@` between two non-empty
 * runs is worth trying to reply to, and a stricter pattern rejects real
 * addresses. This only decides whether the field is worth keeping.
 */
const LOOKS_LIKE_EMAIL = /^[^@\s]+@[^@\s]+$/;

/**
 * Returns `{ ok: false }` with no reason attached. The caller answers every
 * rejection identically: saying which check tripped would hand a bot a debugger
 * for the ones it has not worked out yet.
 */
export function accept(raw, now = Date.now()) {
  if (typeof raw !== "string") return { ok: false };
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return { ok: false };

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return { ok: false };
  }
  if (payload === null || typeof payload !== "object") return { ok: false };

  const { message, subject, email, trap, mountedAt } = payload;

  // The honeypot: a field no person is shown, so anything in it was not typed.
  if (typeof trap !== "string" || trap !== "") return { ok: false };

  // `mountedAt` comes from the browser and a bot can lie about it, so this only
  // costs the naive ones. It is cheap, and it is the reason the field exists.
  if (typeof mountedAt !== "number" || !Number.isFinite(mountedAt)) return { ok: false };
  if (now - mountedAt < MIN_DWELL_MS) return { ok: false };

  if (typeof message !== "string") return { ok: false };
  const note = message.trim();
  if (note === "" || note.length > MESSAGE_LIMIT) return { ok: false };

  // Optional, so a missing subject is not a refusal — but a present one that is
  // not a string is a caller doing something other than filling in the form.
  if (subject !== undefined && typeof subject !== "string") return { ok: false };
  if (typeof subject === "string" && subject.length > SUBJECT_LIMIT) return { ok: false };
  // A subject line is one line, and `bodyFor` labels it as one: a newline in
  // there would read as the note having started early.
  const heading = typeof subject === "string" ? subject.replace(/\s+/g, " ").trim() : "";

  const trimmed = typeof email === "string" ? email.trim() : "";
  const replyTo = LOOKS_LIKE_EMAIL.test(trimmed) ? trimmed : undefined;

  return { ok: true, note, replyTo, subject: heading === "" ? undefined : heading };
}

/**
 * The mail body. Everything a visitor typed is in here rather than in a field
 * SNS treats as a header, which is what keeps header injection out of this path
 * entirely — the subject line included, which is why it is a body line here
 * rather than the `Subject` the handler publishes.
 *
 * It leads, because a constant `Subject` leaves the first body line as the only
 * thing a mail client has to preview the message with.
 */
export function bodyFor({ note, subject, replyTo }) {
  return [
    subject ? `Subject: ${subject}` : "No subject given.",
    "",
    note,
    "",
    "—",
    replyTo ? `Reply to: ${replyTo}` : "No reply address given.",
  ].join("\n");
}
