/**
 * Same-origin, so there is no CORS preflight and no cross-origin URL in the
 * bundle: Caddy proxies this path to the endpoint. See docs/planning/TODO.md.
 */
const ENDPOINT = "/api/contact";

/** Long enough for anything worth reading, short enough to bound the payload. */
export const MESSAGE_LIMIT = 4000;

/** Mirrors `SUBJECT_LIMIT` in `infra/lambda/contact/accept.mjs`. */
export const SUBJECT_LIMIT = 200;

/**
 * How long a real person takes to read the form and type something. A submit
 * faster than this was not typed. The check is repeated server-side, because
 * this timestamp comes from the client and a bot can lie about it — it is only
 * here to spare the endpoint the naive traffic.
 */
export const MIN_DWELL_MS = 2000;

export interface Feedback {
  message: string;
  /**
   * The subject line, when the visitor left one. It reaches me as a line of the
   * mail body rather than as its `Subject`, because nothing a stranger typed
   * goes anywhere a mail header could be — see `bodyFor` in the endpoint.
   */
  subject?: string;
  /** Optional: someone saying the site made them smile is owed no identity. */
  email?: string;
  /** The honeypot's value. A person never sees the field, so this stays empty. */
  trap: string;
  /** When the form mounted, for the dwell check. */
  mountedAt: number;
}

/**
 * Costs a bot nothing it lacked — it reads the raw response and never runs this.
 * The endpoint still answers all of its own checks with one indistinct 400.
 */
export type FailureReason = "busy" | "refused" | "server" | "offline";

export type SubmitResult = { ok: true } | { ok: false; reason: FailureReason };

/**
 * `busy` is two in flight at once, never "you have sent too many": the cap is
 * `reserved_concurrent_executions` in infra/contact.tf, and nothing limits one
 * sender. The copy has to say so carefully.
 */
function reasonFor(status: number): FailureReason {
  if (status === 429) return "busy";
  if (status >= 500) return "server";
  return "refused";
}

export async function submitFeedback(feedback: Feedback): Promise<SubmitResult> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedback),
    });
  } catch {
    return { ok: false, reason: "offline" };
  }
  return response.ok ? { ok: true } : { ok: false, reason: reasonFor(response.status) };
}
