import type { Dir } from "../engine/maze";

/** How far a finger must travel, in CSS pixels, before the movement is a swipe. */
export const SWIPE_MIN = 18;

/** The way a finger has moved, by whichever axis it moved along most; `null` short of a swipe. */
export function swipeDir(dx: number, dy: number): Dir | null {
  if (Math.hypot(dx, dy) < SWIPE_MIN) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}
