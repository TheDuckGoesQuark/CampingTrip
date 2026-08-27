/**
 * True when any of `dates` falls after the visitor's previous session — what the
 * "New" badge keys off. A first-time visitor is shown nothing as new, because
 * everything is.
 */
export function isNewSince(
  lastVisitedAt: string | null,
  ...dates: (string | undefined)[]
): boolean {
  if (!lastVisitedAt) return false;
  const last = new Date(lastVisitedAt).getTime();
  return dates.some((date) => date !== undefined && new Date(date).getTime() > last);
}
