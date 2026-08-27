/** True when an item appeared or changed after the visitor's previous session. */
export function isNewSince(
  lastVisitedAt: string | null,
  addedAt?: string,
  updatedAt?: string,
): boolean {
  // A first-time visitor is shown nothing as new, because everything is.
  if (!lastVisitedAt) return false;
  const last = new Date(lastVisitedAt).getTime();
  return [addedAt, updatedAt].some((at) => at !== undefined && new Date(at).getTime() > last);
}
