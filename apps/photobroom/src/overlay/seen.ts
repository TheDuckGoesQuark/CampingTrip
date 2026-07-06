/**
 * Remembers which Google Photos the user has already reviewed on this machine,
 * so re-sweeping the same search doesn't show them again.
 *
 * Uses chrome.storage.local (extension-scoped, survives restarts) when
 * available, falling back to localStorage.
 *
 * saveSeen MERGES with whatever is already stored before writing, so two
 * Google Photos tabs (each its own content script, sharing one extension-scoped
 * store) can't clobber each other's history. The list is capped FIFO so it
 * can't grow without bound.
 */
const KEY = "photobroom.seen";
/** Keep at most this many ids; oldest are dropped first. */
const MAX_SEEN = 50_000;

interface ChromeLocal {
  get(keys: string, cb: (items: Record<string, unknown>) => void): void;
  set(items: Record<string, unknown>, cb?: () => void): void;
}

const storage: ChromeLocal | undefined = (
  globalThis as { chrome?: { storage?: { local?: ChromeLocal } } }
).chrome?.storage?.local;

function readRaw(): Promise<string[]> {
  if (storage) {
    return new Promise((resolve) =>
      storage.get(KEY, (items) => resolve((items?.[KEY] as string[] | undefined) ?? [])),
    );
  }
  try {
    return Promise.resolve(JSON.parse(localStorage.getItem(KEY) || "[]") as string[]);
  } catch {
    return Promise.resolve([]);
  }
}

function writeRaw(arr: string[]): void {
  if (storage) {
    storage.set({ [KEY]: arr });
    return;
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch {
    // Quota exceeded / unavailable — drop the oldest half and try once more.
    try {
      localStorage.setItem(KEY, JSON.stringify(arr.slice(Math.floor(arr.length / 2))));
    } catch {
      /* give up — best effort */
    }
  }
}

export async function loadSeen(): Promise<Set<string>> {
  return new Set(await readRaw());
}

/** Union `ids` into the stored set (re-reading first so we never clobber). */
export async function saveSeen(ids: Set<string>): Promise<void> {
  const merged = new Set(await readRaw());
  for (const id of ids) merged.add(id);
  let arr = [...merged];
  if (arr.length > MAX_SEEN) arr = arr.slice(arr.length - MAX_SEEN);
  writeRaw(arr);
}

export function clearSeen(): void {
  writeRaw([]);
}
