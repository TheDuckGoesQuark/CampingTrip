import type { Dir } from "../engine/maze";

/** How far a finger must travel, in CSS pixels, before the movement is a swipe. */
export const SWIPE_MIN = 18;

/** How close to the pad's centre, in CSS pixels, a tap means no direction at all. */
export const HUB_RADIUS = 6;

/** The way an offset points, by whichever axis it runs along most. */
function dirOf(dx: number, dy: number): Dir {
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

/** The way a finger has moved; `null` short of a swipe. */
export function swipeDir(dx: number, dy: number): Dir | null {
  return Math.hypot(dx, dy) < SWIPE_MIN ? null : dirOf(dx, dy);
}

/**
 * The arm a tap on the pad's area means, from where it landed against the
 * pad's centre: the area is cut into four by an X, so the whole of it is pad.
 */
export function padDir(dx: number, dy: number): Dir | null {
  return Math.hypot(dx, dy) < HUB_RADIUS ? null : dirOf(dx, dy);
}
