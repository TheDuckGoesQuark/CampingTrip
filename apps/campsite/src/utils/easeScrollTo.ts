/** Quadratic ease-in-out: `t` in [0, 1] to progress in [0, 1]. */
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

/** A page inside a CatOS window scrolls the window's frame, an open page the document. */
export function scrollParentOf(node: Element): Element {
  for (let el = node.parentElement; el; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el);
    if ((overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight) {
      return el;
    }
  }
  return document.scrollingElement ?? document.documentElement;
}

const MIN_MS = 300;
const MAX_MS = 800;
const MS_PER_PX = 0.35;

function px(value: string): number {
  return Number.parseFloat(value) || 0;
}

/**
 * Scrolls `target` to the top of its scroll parent, respecting the parent's
 * `scroll-padding-top` and the target's `scroll-margin-top` the way the
 * browser's own fragment navigation would. Resolves `true` once the target is in
 * place, `false` if the visitor took the scroll back before it got there.
 */
export function easeScrollTo(target: HTMLElement, { instant = false } = {}): Promise<boolean> {
  const parent = scrollParentOf(target);
  const parentTop = parent === document.scrollingElement ? 0 : parent.getBoundingClientRect().top;
  const inset =
    px(getComputedStyle(parent).scrollPaddingTop) + px(getComputedStyle(target).scrollMarginTop);
  const from = parent.scrollTop;
  const furthest = Math.max(0, parent.scrollHeight - parent.clientHeight);
  const to = Math.min(
    furthest,
    Math.max(0, target.getBoundingClientRect().top - parentTop + from - inset),
  );
  const distance = to - from;

  /* `scrollTo` with a behaviour, never `scrollTop =`: the window's frame carries
     `scroll-behavior: smooth`, and an assignment there is itself animated by the
     browser, which drags behind the curve and then catches up in a rush. */
  const place = (top: number) => parent.scrollTo({ top, behavior: "instant" });

  if (instant || Math.abs(distance) < 1) {
    place(to);
    return Promise.resolve(true);
  }

  const duration = Math.min(MAX_MS, MIN_MS + Math.abs(distance) * MS_PER_PX);
  let resolve!: (landed: boolean) => void;
  const promise = new Promise<boolean>((settle) => {
    resolve = settle;
  });
  let start: number | undefined;
  let frame = 0;
  const finish = (landed: boolean) => {
    cancelAnimationFrame(frame);
    parent.removeEventListener("wheel", takenBack);
    parent.removeEventListener("touchstart", takenBack);
    resolve(landed);
  };
  function takenBack() {
    finish(false);
  }
  parent.addEventListener("wheel", takenBack, { passive: true });
  parent.addEventListener("touchstart", takenBack, { passive: true });

  const step = (now: number) => {
    start ??= now;
    const t = Math.min(1, (now - start) / duration);
    place(from + distance * easeInOut(t));
    if (t < 1) frame = requestAnimationFrame(step);
    else finish(true);
  };
  frame = requestAnimationFrame(step);
  return promise;
}
