/**
 * Remembers which Google Photos the user has already reviewed on this machine,
 * so re-sweeping the same search doesn't show them again.
 *
 * Uses chrome.storage.local (extension-scoped, survives restarts) when
 * available, falling back to localStorage. Stores a flat list of photo ids —
 * a few hundred thousand ids fit comfortably in either store.
 */
const KEY = 'photobroom.seen';

interface ChromeLocal {
  get(keys: string, cb: (items: Record<string, unknown>) => void): void;
  set(items: Record<string, unknown>, cb?: () => void): void;
}

const storage: ChromeLocal | undefined = (
  globalThis as { chrome?: { storage?: { local?: ChromeLocal } } }
).chrome?.storage?.local;

export async function loadSeen(): Promise<Set<string>> {
  if (storage) {
    return new Promise((resolve) =>
      storage.get(KEY, (items) =>
        resolve(new Set((items?.[KEY] as string[] | undefined) ?? []))
      )
    );
  }
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || '[]') as string[]);
  } catch {
    return new Set();
  }
}

export function saveSeen(ids: Set<string>): void {
  const arr = [...ids];
  if (storage) {
    storage.set({ [KEY]: arr });
  } else {
    try {
      localStorage.setItem(KEY, JSON.stringify(arr));
    } catch {
      /* storage full or unavailable — best effort */
    }
  }
}

export function clearSeen(): void {
  saveSeen(new Set());
}
