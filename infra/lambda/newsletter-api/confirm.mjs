// Free of the SDK so it can be tested; the store and the queue are passed in.
import { NOTICES } from "./accept.mjs";

/** The site marks this issue `welcome: true`; a test there holds the two together. */
export const WELCOME_ISSUE = "trailhead-newsletter";

/**
 * Activates the row and, the first time, queues the welcome for that address.
 * The claim on the row comes before the enqueue, so a second click queues
 * nothing; a failed enqueue gives the claim back for the next click to retry.
 */
export async function confirmSubscriber({ store, enqueue, token, nowIso }) {
  if (!token) return NOTICES.linkExpired;
  const key = await store.findByToken("confirm-token", "confirm_token", token);
  if (!key) return NOTICES.linkExpired;
  if (!(await store.activate(key, nowIso))) return NOTICES.linkExpired;

  const row = await store.claimWelcome(key, nowIso);
  if (row) {
    try {
      await enqueue({
        issue: WELCOME_ISSUE,
        email: row.email,
        unsubscribeToken: row.unsubscribe_token,
      });
    } catch (error) {
      await store.releaseWelcome(key);
      console.error(`welcome not queued: ${error?.name ?? "error"}`);
    }
  }
  return NOTICES.confirmed;
}
