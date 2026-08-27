import { isBrowserPath, parseBlogPath } from "./blogPaths";

/**
 * The browser is one window whatever page it holds, so it needs an id that is
 * not a path. Every other window *is* its path — a desktop item's URL already
 * identifies it uniquely.
 */
export const WINDOW_BROWSER = "browser";

/**
 * The window in front — the last one, since the stack renders back to front.
 * Indexed rather than `at(-1)`, which the app's TS lib target does not carry.
 */
export function frontWindow(ids: string[]): string | undefined {
  return ids[ids.length - 1];
}

/** Which window a blog path belongs in. */
export function windowIdFor(blogPath: string): string {
  return isBrowserPath(blogPath) ? WINDOW_BROWSER : blogPath;
}

/** True for the browser's own id, as opposed to a desktop item's path. */
export function isBrowserWindow(id: string): boolean {
  return id === WINDOW_BROWSER;
}

/**
 * The path a window should put in the address bar when it comes to the front.
 * The browser's is whatever page it currently holds; a desktop item's is its id.
 */
export function pathForWindow(id: string, browserPath: string | null): string | null {
  if (isBrowserWindow(id)) return browserPath;
  return parseBlogPath(id) ? id : null;
}
