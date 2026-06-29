/**
 * Google Photos DOM automation for the in-page overlay.
 *
 * Everything here runs inside the photos.google.com content-script context, so
 * it can read the grid directly (native thumbnails — no CORP/data-URL hack) and
 * drive Google's own multi-select + "Move to bin" instead of deleting one photo
 * at a time.
 *
 * Every long-running routine takes an AbortSignal and bails out promptly when
 * the user hits Stop.
 */
import type { ScrapedPhoto } from '../types';

export class AbortError extends Error {
  constructor() {
    super('Aborted');
    this.name = 'AbortError';
  }
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new AbortError());
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t);
        reject(new AbortError());
      },
      { once: true }
    );
  });

const throwIfAborted = (signal?: AbortSignal) => {
  if (signal?.aborted) throw new AbortError();
};

const PHOTO_HREF = /\/photo\/([A-Za-z0-9_-]+)/;

function photoIdFromAnchor(a: Element): string | null {
  const href = a.getAttribute('href') || '';
  return href.match(PHOTO_HREF)?.[1] ?? null;
}

function upscale(url: string): string {
  return url ? url.replace(/=w\d+-h\d+/, '=w640-h640') : '';
}

function thumbnailForAnchor(a: Element): string {
  const bgEl = a.querySelector('[data-latest-bg]');
  const attr = bgEl?.getAttribute('data-latest-bg');
  if (attr) return attr;
  const styled = a.querySelector('[style*="background-image"]') as HTMLElement | null;
  const styleStr = styled?.getAttribute('style') || '';
  const m = styleStr.match(/background-image\s*:\s*url\(["']?([^"')]+)["']?\)/i);
  if (m?.[1]) return m[1];
  const img = a.querySelector('img');
  return img?.getAttribute('src') || '';
}

/** The select checkbox for a grid cell (its aria-label matches the photo's). */
function checkboxForAnchor(a: Element): HTMLElement | null {
  let node: Element | null = a;
  for (let i = 0; node && i < 4; i++, node = node.parentElement) {
    const cb = node.querySelector('[role="checkbox"]');
    if (cb) return cb as HTMLElement;
  }
  return null;
}

/** Collect the photos currently rendered in the grid (deduped by id). */
function collectVisible(into: Map<string, ScrapedPhoto>) {
  for (const a of document.querySelectorAll('a[href*="/photo/"]')) {
    const id = photoIdFromAnchor(a);
    if (!id || into.has(id)) continue;
    // Skip cells with no select checkbox (e.g. the featured/hero image).
    if (!checkboxForAnchor(a)) continue;
    const thumbnailUrl = upscale(thumbnailForAnchor(a));
    if (!thumbnailUrl) continue;
    const ariaLabel =
      a.getAttribute('aria-label') ||
      a.closest('[aria-label]')?.getAttribute('aria-label') ||
      '';
    into.set(id, { id, thumbnailUrl, ariaLabel });
  }
}

/**
 * Find the scrollable container for the results grid. Google Photos scrolls an
 * inner element, not window — scrolling window does nothing (this was why only
 * the first date section ever loaded). Walk up from a photo cell to the nearest
 * actually-scrollable ancestor.
 */
function findScrollContainer(): HTMLElement {
  const anchor = document.querySelector('a[href*="/photo/"]');
  let node: HTMLElement | null = anchor?.parentElement ?? null;
  while (node) {
    const oy = getComputedStyle(node).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight + 50) {
      return node;
    }
    node = node.parentElement;
  }
  return (document.scrollingElement as HTMLElement) || document.documentElement;
}

export interface CollectProgress {
  count: number;
}

/**
 * Scroll the results grid to the bottom, collecting every photo as virtualised
 * rows render. Stops when no new photos appear for several scrolls, on the
 * safety cap, or on abort.
 */
export async function collectAllPhotos(
  onProgress: (p: CollectProgress) => void,
  signal: AbortSignal
): Promise<ScrapedPhoto[]> {
  const photos = new Map<string, ScrapedPhoto>();
  const container = findScrollContainer();
  const MAX_IDLE = 6;
  const MAX_PHOTOS = 1000;
  const STEP_DELAY = 700;

  collectVisible(photos);
  onProgress({ count: photos.size });

  let idle = 0;
  let lastScrollTop = -1;
  while (idle < MAX_IDLE && photos.size < MAX_PHOTOS) {
    throwIfAborted(signal);
    const prev = photos.size;

    container.scrollBy(0, Math.max(400, container.clientHeight * 0.85));
    await sleep(STEP_DELAY, signal);
    collectVisible(photos);
    onProgress({ count: photos.size });

    const noGrowth = photos.size === prev;
    const noScroll = container.scrollTop === lastScrollTop;
    lastScrollTop = container.scrollTop;
    // Idle only when we neither found new photos nor managed to scroll further.
    idle = noGrowth && noScroll ? idle + 1 : 0;
  }

  container.scrollTo({ top: 0 });
  return Array.from(photos.values());
}

export interface SelectProgress {
  selected: number;
  target: number;
}

/**
 * Select the given photo ids using Google's native checkboxes, scrolling the
 * grid so virtualised cells render. Returns how many were actually selected.
 */
export async function selectPhotos(
  ids: string[],
  onProgress: (p: SelectProgress) => void,
  signal: AbortSignal
): Promise<number> {
  const target = new Set(ids);
  const selected = new Set<string>();
  const container = findScrollContainer();
  const MAX_IDLE = 6;
  const STEP_DELAY = 500;

  container.scrollTo({ top: 0 });
  await sleep(300, signal);

  let idle = 0;
  let lastScrollTop = -1;
  while (selected.size < target.size && idle < MAX_IDLE) {
    throwIfAborted(signal);
    let clickedThisPass = false;

    for (const a of document.querySelectorAll('a[href*="/photo/"]')) {
      const id = photoIdFromAnchor(a);
      if (!id || !target.has(id) || selected.has(id)) continue;
      const cb = checkboxForAnchor(a);
      if (!cb) continue;
      if (cb.getAttribute('aria-checked') !== 'true') {
        // Hover then click — the select circle is hover-revealed.
        cb.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        cb.click();
        clickedThisPass = true;
      }
      selected.add(id);
      onProgress({ selected: selected.size, target: target.size });
    }

    if (selected.size >= target.size) break;

    const before = container.scrollTop;
    container.scrollBy(0, Math.max(400, container.clientHeight * 0.85));
    await sleep(STEP_DELAY, signal);
    const noScroll = container.scrollTop === before || container.scrollTop === lastScrollTop;
    lastScrollTop = container.scrollTop;
    idle = !clickedThisPass && noScroll ? idle + 1 : 0;
  }

  return selected.size;
}

/** getClientRects works for position:fixed elements; offsetParent does not. */
function isVisible(el: Element): boolean {
  return (el as HTMLElement).getClientRects().length > 0;
}

function findButtons(pattern: RegExp, scope: ParentNode = document): HTMLElement[] {
  const els = scope.querySelectorAll('button, [role="button"], [role="menuitem"], [data-mdc-dialog-action]');
  const out: HTMLElement[] = [];
  for (const el of els) {
    const label = `${el.textContent || ''} ${el.getAttribute('aria-label') || ''}`;
    if (isVisible(el) && pattern.test(label)) out.push(el as HTMLElement);
  }
  return out;
}

function findButton(pattern: RegExp, scope: ParentNode = document): HTMLElement | null {
  return findButtons(pattern, scope)[0] ?? null;
}

/**
 * Click the bulk "Move to bin" action (appears once photos are selected) and
 * confirm the resulting dialog/pop-up. Returns true if it ran the action.
 */
export async function moveSelectedToBin(signal: AbortSignal): Promise<boolean> {
  const TRASH = /move to (bin|trash)|delete/i;
  // The selection toolbar (with its "Move to bin" button) renders a moment
  // after the last checkbox is ticked — poll for it rather than assuming.
  let binBtn: HTMLElement | null = null;
  for (let i = 0; i < 15 && !binBtn; i++) {
    throwIfAborted(signal);
    binBtn = findButton(TRASH);
    if (!binBtn) await sleep(200, signal);
  }
  if (!binBtn) throw new Error('Could not find the bulk "Move to bin" button');
  binBtn.click();

  // The confirmation pop-up's button is also labelled "Move to bin". It renders
  // (and animates in) a moment later. Search the whole document each poll,
  // exclude the toolbar button we just clicked, and prefer the dialog's action
  // button (data-mdc-dialog-action / inside a [role=dialog]) so we don't pick
  // some other popup or re-click the toolbar.
  const CONFIRM = /move to (bin|trash)|delete|confirm|remove/i;
  let confirmBtn: HTMLElement | null = null;
  for (let i = 0; i < 24 && !confirmBtn; i++) {
    throwIfAborted(signal);
    await sleep(150, signal);
    const matches = findButtons(CONFIRM).filter((el) => el !== binBtn);
    confirmBtn =
      matches.find(
        (el) =>
          el.hasAttribute('data-mdc-dialog-action') ||
          el.closest('[role="dialog"], [role="alertdialog"]')
      ) ??
      matches[0] ??
      null;
  }
  if (!confirmBtn) throw new Error('Could not find the confirm button in the pop-up');
  confirmBtn.click();
  await sleep(800, signal);
  return true;
}

/** Clear any active selection (used on abort/cleanup). */
export function clearSelection() {
  findButton(/clear selection/i)?.click();
}
