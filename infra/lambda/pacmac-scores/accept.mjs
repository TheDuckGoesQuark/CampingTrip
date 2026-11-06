// What the leaderboard will take. Nothing a stranger posts is trusted: the
// initials are checked against their one allowed shape and the score against
// what a single board can be worth.

/**
 * The most one board of MacMan can score: every pellet, all four ghosts on each
 * power pellet, and both fruit. `apps/campsite/.../engine/scoring.test.ts` reads
 * this constant and fails if the game's own sum moves away from it.
 */
export const MAX_SCORE = 14_800;

/** Every way to score is a multiple of ten, so anything else was not played. */
export const SCORE_STEP = 10;

export const MAX_BODY_BYTES = 256;

export const TABLE_SIZE = 10;

const INITIALS = /^[A-Z]{3}$/;

/** `{ ok: true, entry }` for a score worth recording, `{ ok: false }` for anything else. */
export function acceptScore(raw) {
  if (typeof raw !== "string" || Buffer.byteLength(raw) > MAX_BODY_BYTES) return { ok: false };
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return { ok: false };
  }
  if (typeof body !== "object" || body === null) return { ok: false };
  const { initials, score } = body;
  if (typeof initials !== "string" || !INITIALS.test(initials)) return { ok: false };
  if (!Number.isInteger(score) || score <= 0 || score > MAX_SCORE) return { ok: false };
  if (score % SCORE_STEP !== 0) return { ok: false };
  return { ok: true, entry: { initials, score } };
}

/** Whether a score would get onto a table already best first. */
export function qualifies(table, score) {
  return table.length < TABLE_SIZE || score > table[table.length - 1].score;
}
