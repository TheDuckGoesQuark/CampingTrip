/**
 * Same-origin, as the contact endpoint is: Caddy proxies this path, so the
 * page never names another origin. A plain form post goes to the same address
 * and is answered with a redirect; this helper is the scripted path, which asks
 * for JSON so it can show the answer in place.
 */
export const SUBSCRIBE_ENDPOINT = "/api/newsletter/subscribe";

export interface Subscription {
  email: string;
  /** The honeypot's value. A person never sees the field, so this stays empty. */
  trap: string;
}

/**
 * `paused` is the day's confirmation cap, which the endpoint answers with a
 * 503; the copy says try tomorrow rather than try again.
 */
export type FailureReason = "refused" | "paused" | "server" | "offline";

export type SubmitResult = { ok: true } | { ok: false; reason: FailureReason };

function reasonFor(status: number): FailureReason {
  if (status === 503) return "paused";
  if (status >= 500) return "server";
  return "refused";
}

export async function submitSubscription(subscription: Subscription): Promise<SubmitResult> {
  let response: Response;
  try {
    response = await fetch(SUBSCRIBE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(subscription),
    });
  } catch {
    return { ok: false, reason: "offline" };
  }
  return response.ok ? { ok: true } : { ok: false, reason: reasonFor(response.status) };
}
