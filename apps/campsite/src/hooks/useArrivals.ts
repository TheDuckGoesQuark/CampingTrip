import { type RefObject, useEffect, useState } from "react";

/**
 * Without it a block anchored to the foot of a page counts as in view while its
 * top edge is still a sliver.
 */
const ARRIVAL_MARGIN = "0px 0px -10% 0px";

/**
 * Counts arrivals: `settleMs` in view uninterrupted, having been away since the
 * last one. Bumping `restart` begins the wait again without it having left.
 *
 * The wait is what separates arriving from passing through — an in-page link
 * scrolls smoothly, so the target is in view for most of the journey to it. It
 * is also why a followed link cannot count twice: the click and the scroll
 * answering it restart one timer.
 */
export function useArrivals(
  ref: RefObject<Element | null>,
  settleMs: number,
  restart: number,
): number {
  const [inView, setInView] = useState(false);
  const [arrivals, setArrivals] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: ARRIVAL_MARGIN,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  useEffect(() => {
    if (!inView) return;

    const timer = window.setTimeout(() => setArrivals((n) => n + 1), settleMs);
    return () => window.clearTimeout(timer);
  }, [inView, restart, settleMs]);

  return arrivals;
}
