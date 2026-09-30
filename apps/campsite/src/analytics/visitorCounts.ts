// GoatCounter's visitor counter: what it serves without a login, and so the
// only thing this page ever asks it for. Nothing here is a credential.

/** The host `index.html` loads `count.js` from. */
export const STATS_ORIGIN = "https://stats.jordanscamp.site";

export const STATS_DASHBOARD = `${STATS_ORIGIN}/`;

/** GoatCounter's name for the whole site. Case matters, and it takes no slash. */
export const SITE_WIDE = "TOTAL";

/** The endpoint puts the leading slash back itself. `since` is a UTC day. */
export function counterUrl(path: string, since?: string): string {
  const name = path === SITE_WIDE ? SITE_WIDE : path.replace(/^\/+/, "");
  const url = new URL(`/counter/${name}.json`, STATS_ORIGIN);
  if (since !== undefined) url.searchParams.set("start", since);
  return url.toString();
}

/** The count arrives formatted for a person, with whichever thousands separator the dashboard is set to. */
export function parseCount(body: unknown): number | null {
  if (typeof body !== "object" || body === null) return null;
  const { count } = body as { count?: unknown };
  if (typeof count !== "string") return null;
  const digits = count.replace(/\D/g, "");
  return digits === "" ? null : Number(digits);
}

/** A path nobody has visited answers 404 with a zero, and that zero is a real figure. */
export async function fetchCount(
  path: string,
  since?: string,
  fetchImpl: typeof fetch = fetch,
): Promise<number | null> {
  try {
    const response = await fetchImpl(counterUrl(path, since));
    if (response.status !== 200 && response.status !== 404) return null;
    return parseCount(await response.json());
  } catch {
    return null;
  }
}

export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Oldest first. */
export function lastDays(n: number, today: Date): string[] {
  const days: string[] = [];
  for (let back = n - 1; back >= 0; back -= 1) {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() - back);
    days.push(isoDay(day));
  }
  return days;
}

export interface DayCount {
  day: string;
  count: number;
}

/**
 * The endpoint's `end` is a midnight and its range is inclusive at both ends,
 * so a same-day window would count one hour. Each day is asked for "from here
 * to now" and neighbours subtracted. `null` if any day is unavailable, since a
 * gap would read as a quiet day.
 */
export async function fetchDailyCounts(
  path: string,
  days: string[],
  fetchImpl: typeof fetch = fetch,
): Promise<DayCount[] | null> {
  const fromEach = await Promise.all(days.map((day) => fetchCount(path, day, fetchImpl)));
  if (fromEach.some((count) => count === null)) return null;
  const cumulative = fromEach as number[];
  return days.map((day, i) => ({
    day,
    count: Math.max(0, cumulative[i] - (cumulative[i + 1] ?? 0)),
  }));
}
