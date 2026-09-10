/**
 * Same-origin, so there is no CORS preflight and no cross-origin URL in the
 * bundle: Caddy proxies this path to the endpoint. See docs/planning/TODO.md.
 */
const ENDPOINT = "/api/contact";

/** Long enough for anything worth reading, short enough to bound the payload. */
export const MESSAGE_LIMIT = 4000;

/**
 * How long a real person takes to read the form and type something. A submit
 * faster than this was not typed. The check is repeated server-side, because
 * this timestamp comes from the client and a bot can lie about it — it is only
 * here to spare the endpoint the naive traffic.
 */
export const MIN_DWELL_MS = 2000;

export interface Feedback {
  message: string;
  /** Optional: someone saying the site made them smile is owed no identity. */
  email?: string;
  /** The honeypot's value. A person never sees the field, so this stays empty. */
  trap: string;
  /** When the form mounted, for the dwell check. */
  mountedAt: number;
}

export type SubmitResult = { ok: true } | { ok: false };

/**
 * Never throws and never reports *why* it failed: the caller's only useful move
 * is to offer the `mailto:` instead, and a reason would tell a bot which check
 * it tripped.
 */
export async function submitFeedback(feedback: Feedback): Promise<SubmitResult> {
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedback),
    });
    return response.ok ? { ok: true } : { ok: false };
  } catch {
    return { ok: false };
  }
}
