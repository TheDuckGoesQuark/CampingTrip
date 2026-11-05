import type { Dir } from "../engine/maze";

/** How far from centre, out of 1, the knob must go before it counts as a direction. */
export const DEAD_ZONE = 0.35;

/** The way a knob position points, by whichever axis it leans along most; `null` near the centre. */
export function dirOf(x: number, y: number): Dir | null {
  if (Math.hypot(x, y) < DEAD_ZONE) return null;
  if (Math.abs(x) > Math.abs(y)) return x > 0 ? "right" : "left";
  return y > 0 ? "down" : "up";
}
