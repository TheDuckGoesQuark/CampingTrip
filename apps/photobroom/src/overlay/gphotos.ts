/**
 * Google Photos page model.
 *
 * ALL knowledge of Google Photos' DOM lives in this file — the overlay UI only
 * ever calls the semantic operations (collectAllPhotos / selectPhotos /
 * moveSelectedToBin / clearSelection). When Google changes their markup, the
 * SELECTORS block below is the single place to update.
 *
 * Everything runs inside the photos.google.com content-script context, so it
 * reads the grid directly (native thumbnails) and drives Google's own
 * multi-select + "Move to bin" rather than deleting one photo at a time.
 *
 * Long-running routines take an AbortSignal and bail promptly on Stop.
 *
 * LAST VERIFIED against photos.google.com on 2026-06-29 (en-GB locale).
 */
import type { ScrapedPhoto } from '../types';

// ---------------------------------------------------------------------------
// Selectors — the only Google-Photos-specific knowledge in the app.
// ---------------------------------------------------------------------------

export const SELECTORS = {
  /** Each grid photo is an anchor whose href ends in /photo/<id>. */
  photoLink: 'a[href*="/photo/"]',
  /** Extracts the media id from a (possibly search-scoped, relative) href. */
  photoId: /\/photo\/([A-Za-z0-9_-]+)/,
  /** Thumbnail URL is a background-image on a child div with this attribute. */
  thumbAttr: 'data-latest-bg',
  /** Fallback: any descendant carrying an inline background-image. */
  bgImageStyle: '[style*="background-image"]',
  /** Per-cell select checkbox (its aria-label matches the photo's). */
  checkbox: '[role="checkbox"]',
  /** Clickable controls we search for actions/confirmations. */
  buttonish: 'button, [role="button"], [role="menuitem"], [data-mdc-dialog-action]',
  /** Confirmation pop-up containers. */
  dialog: '[role="dialog"], [role="alertdialog"]',
  /** Toolbar / lightbox trash control. */
  trashLabel: /move to (bin|trash)|delete/i,
  /** Confirm button inside the "move to bin?" pop-up. */
  confirmLabel: /move to (bin|trash)|delete|confirm|remove/i,
  /** Clears an active multi-selection. */
  clearSelectionLabel: /clear selection/i,
  /** Marks a real dialog action button (vs the toolbar button of same label). */
  dialogActionAttr: 'data-mdc-dialog-action',
} as const;

/**
 * Timing/limits — the other Google-fragile knobs (alongside SELECTORS). If
 * Google's render latency or virtualisation changes, tune these in one place.
 */
const TIMING = {
  /** Give up scrolling after this many passes with no new progress. */
  maxIdlePasses: 6,
  /** Hard cap on photos collected in one sweep (very large searches). */
  maxPhotos: 1000,
  collectStepDelay: 700,
  selectStepDelay: 500,
  settleAfterScrollTop: 300,
  /** Poll budget for the bulk "Move to bin" button (tries × delayMs). */
  binButton: { tries: 15, delay: 200 },
  /** Poll budget for the confirm pop-up button. */
  confirmButton: { tries: 24, delay: 150 },
  /** Let the bin animation/toast settle after confirming. */
  afterConfirm: 800,
} as const;

// ---------------------------------------------------------------------------
// Abort plumbing
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Pure DOM readers (exported for tests — no scrolling/clicking/visibility)
// ---------------------------------------------------------------------------

export function idFromAnchor(a: Element): string | null {
  return (a.getAttribute('href') || '').match(SELECTORS.photoId)?.[1] ?? null;
}

/** Grid thumbnails carry a size directive (=w81-h177); bump it for the deck. */
export function upscale(url: string): string {
  return url ? url.replace(/=w\d+-h\d+/, '=w640-h640') : '';
}

export function thumbFromAnchor(a: Element): string {
  const bgEl = a.querySelector(`[${SELECTORS.thumbAttr}]`);
  const attr = bgEl?.getAttribute(SELECTORS.thumbAttr);
  if (attr) return attr;
  const styled = a.querySelector(SELECTORS.bgImageStyle);
  const styleStr = styled?.getAttribute('style') || '';
  const m = styleStr.match(/background-image\s*:\s*url\(["']?([^"')]+)["']?\)/i);
  if (m?.[1]) return m[1];
  return a.querySelector('img')?.getAttribute('src') || '';
}

/**
 * The select checkbox for a grid cell. Google gives the checkbox the SAME
 * aria-label as the photo, so match on that first (unambiguous, and avoids
 * grabbing a neighbouring cell's checkbox when this cell has none — e.g. the
 * featured/hero image). Fall back to the nearest checkbox within the immediate
 * cell only.
 */
export function checkboxForAnchor(a: Element): HTMLElement | null {
  const label = a.getAttribute('aria-label');
  let node: Element | null = a;
  if (label) {
    for (let i = 0; node && i < 5; i++, node = node.parentElement) {
      for (const cb of node.querySelectorAll(SELECTORS.checkbox)) {
        if (cb.getAttribute('aria-label') === label) return cb as HTMLElement;
      }
    }
  }
  // No label match: only trust a checkbox in the anchor or its direct parent.
  node = a;
  for (let i = 0; node && i < 2; i++, node = node.parentElement) {
    const cb = node.querySelector(SELECTORS.checkbox);
    if (cb) return cb as HTMLElement;
  }
  return null;
}

/** Read every selectable photo currently in the DOM, deduped by id. */
export function readGrid(root: ParentNode = document): ScrapedPhoto[] {
  const photos = new Map<string, ScrapedPhoto>();
  for (const a of root.querySelectorAll(SELECTORS.photoLink)) {
    const id = idFromAnchor(a);
    if (!id || photos.has(id)) continue;
    // Skip cells with no select checkbox (e.g. the featured/hero image).
    if (!checkboxForAnchor(a)) continue;
    const thumbnailUrl = upscale(thumbFromAnchor(a));
    if (!thumbnailUrl) continue;
    const ariaLabel =
      a.getAttribute('aria-label') ||
      a.closest('[aria-label]')?.getAttribute('aria-label') ||
      '';
    photos.set(id, { id, thumbnailUrl, ariaLabel });
  }
  return [...photos.values()];
}

export function labelOf(el: Element): string {
  return `${el.textContent || ''} ${el.getAttribute('aria-label') || ''}`;
}

/**
 * From a list of candidate buttons matching the confirm label, pick the real
 * dialog confirm: exclude the toolbar button we already clicked, and prefer one
 * that's a dialog action (so we don't re-click the toolbar). Pure — testable.
 */
export function pickConfirmButton(
  candidates: HTMLElement[],
  exclude: HTMLElement | null
): HTMLElement | null {
  const usable = candidates.filter((el) => el !== exclude);
  return (
    usable.find(
      (el) => el.hasAttribute(SELECTORS.dialogActionAttr) || el.closest(SELECTORS.dialog)
    ) ??
    usable[0] ??
    null
  );
}

/** Health check: are the key selectors still finding things? */
export function inspectPage(root: ParentNode = document) {
  const links = [...root.querySelectorAll(SELECTORS.photoLink)];
  let withCheckbox = 0;
  let withThumb = 0;
  for (const a of links) {
    if (checkboxForAnchor(a)) withCheckbox++;
    if (thumbFromAnchor(a)) withThumb++;
  }
  return { photoLinks: links.length, withCheckbox, withThumb };
}

// ---------------------------------------------------------------------------
// Runtime helpers (need real layout — not exercised in jsdom)
// ---------------------------------------------------------------------------

/** getClientRects works for position:fixed elements; offsetParent does not. */
function isVisible(el: Element): boolean {
  return (el as HTMLElement).getClientRects().length > 0;
}

function findButtons(pattern: RegExp, scope: ParentNode = document): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (const el of scope.querySelectorAll(SELECTORS.buttonish)) {
    if (isVisible(el) && pattern.test(labelOf(el))) out.push(el as HTMLElement);
  }
  return out;
}

function findButton(pattern: RegExp, scope: ParentNode = document): HTMLElement | null {
  return findButtons(pattern, scope)[0] ?? null;
}

/**
 * Find the scrollable container for the grid. Google Photos scrolls an inner
 * element, not window — scrolling window does nothing (this was why only the
 * first date section ever loaded). Walk up from a cell to the nearest
 * actually-scrollable ancestor.
 */
function findScrollContainer(): HTMLElement {
  const anchor = document.querySelector(SELECTORS.photoLink);
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

/** Poll `produce` until it yields a truthy value, up to `tries` times. */
async function waitFor<T>(
  produce: () => T | null | undefined,
  { tries, delay }: { tries: number; delay: number },
  signal: AbortSignal
): Promise<T | null> {
  for (let i = 0; i < tries; i++) {
    throwIfAborted(signal);
    const value = produce();
    if (value) return value;
    await sleep(delay, signal);
  }
  return null;
}

/**
 * Drive the virtualised grid: run `onPass` at the current position and after
 * each downward scroll, until onPass reports `done`, no progress is made for
 * `maxIdlePasses`, or abort. Centralises the scroll/idle bookkeeping that both
 * collecting and selecting share.
 */
async function scanGrid(
  onPass: () => { done: boolean; progressed: boolean },
  stepDelay: number,
  signal: AbortSignal,
  startAtTop = false
): Promise<void> {
  const container = findScrollContainer();
  if (startAtTop) {
    container.scrollTo({ top: 0 });
    await sleep(TIMING.settleAfterScrollTop, signal);
  }

  let { done } = onPass();
  let idle = 0;
  let lastScrollTop = -1;
  while (!done && idle < TIMING.maxIdlePasses) {
    throwIfAborted(signal);
    const before = container.scrollTop;
    container.scrollBy(0, Math.max(400, container.clientHeight * 0.85));
    await sleep(stepDelay, signal);

    const pass = onPass();
    done = pass.done;
    const moved = container.scrollTop !== before && container.scrollTop !== lastScrollTop;
    lastScrollTop = container.scrollTop;
    idle = !pass.progressed && !moved ? idle + 1 : 0;
  }
  container.scrollTo({ top: 0 });
}

// ---------------------------------------------------------------------------
// Semantic operations (the overlay's whole API surface)
// ---------------------------------------------------------------------------

export interface CollectProgress {
  count: number;
}

/**
 * Scroll the results grid, collecting every photo as virtualised rows render.
 * Stops on no-new-photos, the safety cap, or abort.
 */
export async function collectAllPhotos(
  onProgress: (p: CollectProgress) => void,
  signal: AbortSignal
): Promise<ScrapedPhoto[]> {
  const photos = new Map<string, ScrapedPhoto>();
  await scanGrid(
    () => {
      const prev = photos.size;
      for (const p of readGrid()) if (!photos.has(p.id)) photos.set(p.id, p);
      onProgress({ count: photos.size });
      return { done: photos.size >= TIMING.maxPhotos, progressed: photos.size > prev };
    },
    TIMING.collectStepDelay,
    signal
  );
  return [...photos.values()];
}

export interface SelectProgress {
  selected: number;
  target: number;
}

/**
 * Select the given photo ids using Google's native checkboxes. Counts a photo
 * only once its checkbox actually reports aria-checked="true", so a click that
 * doesn't register is NOT counted (we'd rather bin fewer than the wrong set).
 * Each cell is clicked at most once, which also guarantees termination if a
 * click never takes. Returns the number confirmed selected — may be < ids.length.
 */
export async function selectPhotos(
  ids: string[],
  onProgress: (p: SelectProgress) => void,
  signal: AbortSignal
): Promise<number> {
  const target = new Set(ids);
  const confirmed = new Set<string>();
  const clicked = new Set<string>();
  const report = () => onProgress({ selected: confirmed.size, target: target.size });

  await scanGrid(
    () => {
      let progressed = false;
      for (const a of document.querySelectorAll(SELECTORS.photoLink)) {
        const id = idFromAnchor(a);
        if (!id || !target.has(id) || confirmed.has(id)) continue;
        const cb = checkboxForAnchor(a);
        if (!cb) continue;

        if (cb.getAttribute('aria-checked') === 'true') {
          confirmed.add(id);
          report();
          progressed = true;
        } else if (!clicked.has(id)) {
          cb.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
          cb.click();
          clicked.add(id);
          progressed = true;
          // Many toggles flip aria-checked synchronously — confirm right away so
          // we don't lose the cell if it scrolls out of view before the next pass.
          if (cb.getAttribute('aria-checked') === 'true') {
            confirmed.add(id);
            report();
          }
        }
      }
      return { done: confirmed.size >= target.size, progressed };
    },
    TIMING.selectStepDelay,
    signal,
    /* startAtTop */ true
  );
  return confirmed.size;
}

/**
 * Click the bulk "Move to bin" action (appears once photos are selected) and
 * confirm the resulting pop-up. Returns true if it ran the action.
 */
export async function moveSelectedToBin(signal: AbortSignal): Promise<boolean> {
  // The selection toolbar (with its "Move to bin" button) renders a moment
  // after the last checkbox is ticked — poll for it.
  const binBtn = await waitFor(() => findButton(SELECTORS.trashLabel), TIMING.binButton, signal);
  if (!binBtn) throw new Error('Could not find the bulk "Move to bin" button');
  binBtn.click();

  // The confirm pop-up's button is also labelled "Move to bin" and animates in
  // a moment later. Poll, then pick the real dialog action (excluding binBtn).
  const confirmBtn = await waitFor(
    () => pickConfirmButton(findButtons(SELECTORS.confirmLabel), binBtn),
    TIMING.confirmButton,
    signal
  );
  if (!confirmBtn) throw new Error('Could not find the confirm button in the pop-up');
  confirmBtn.click();
  await sleep(TIMING.afterConfirm, signal);
  return true;
}

/** Clear any active selection (used on abort/cleanup). */
export function clearSelection() {
  findButton(SELECTORS.clearSelectionLabel)?.click();
}
