/** Later than any real timestamp, so subtracting from it sorts the earliest first. */
const LATEST_MS = 9_999_999_999_999;

/**
 * Highest score first, and on a tie whoever got there first: the score
 * zero-padded, then the time counted down, both read in descending order.
 */
export function sortKey(score, nowMs, id) {
  const time = String(LATEST_MS - nowMs).padStart(13, "0");
  return `${String(score).padStart(6, "0")}#${time}#${id}`;
}
