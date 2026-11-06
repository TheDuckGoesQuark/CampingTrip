import type { Cell, Dir, Maze } from "./maze";
import {
  alignFor,
  canStep,
  isCentred,
  type Mover,
  offCentre,
  opposite,
  slide,
  toNextCentre,
} from "./movement";

export interface MacManState extends Mover {
  /** The way the player last asked for, held until a turn that way opens or it lapses. */
  queued: Dir | null;
  /** The `travelled` past which `queued` is dropped; `Infinity` for a turn held until taken. */
  lapsesAt: number;
  /** Ticks left standing still to swallow, the arcade's pause per pellet. */
  stall: number;
  /** Tiles moved in total, which the mouth animates from. */
  travelled: number;
}

/**
 * How far either side of a tile's centre a turn is still taken, in tiles. The
 * arcade lets the player turn a few pixels early or late and cut the corner,
 * which is most of why its controls feel forgiving.
 */
export const CORNERING = 0.4;

/**
 * How far, in tiles, a key's turn is held after it is asked for. Long enough to
 * ask a tile early; short enough that a turn missed at one junction is not
 * taken at the next one along, where it is usually wrong. A held key repeats,
 * and each repeat asks again, so holding a direction still works however far
 * it is. The touch pad's turns never lapse: it shows the turn it holds.
 */
export const QUEUE_HOLD = 1.5;

const walkable = (cell: Cell) => cell === "floor" || cell === "tunnel";

const travelAxis = (mover: Mover) =>
  mover.dir === "left" || mover.dir === "right" ? mover.x : mover.y;

/** Takes the queued turn if it can be taken from here. */
function turn(maze: Maze, mover: Mover, queued: Dir | null): [Mover, Dir | null] {
  if (!queued || queued === mover.dir) return [mover, null];
  if (queued === opposite(mover.dir)) return [{ ...mover, dir: queued }, null];
  if (offCentre(mover, mover.dir) > CORNERING || !canStep(maze, mover, queued, walkable)) {
    return [mover, queued];
  }
  return [{ ...alignFor(mover, queued), dir: queued }, null];
}

export function moveMacMan(maze: Maze, macman: MacManState, distance: number): MacManState {
  let mover: Mover = { x: macman.x, y: macman.y, dir: macman.dir };
  let { queued, travelled } = macman;
  let remaining = distance;
  // Each pass ends on a tile centre or spends the rest, so a tick's few
  // hundredths of a tile take two passes at most.
  while (remaining > 1e-9) {
    if (queued && travelled > macman.lapsesAt) queued = null;
    [mover, queued] = turn(maze, mover, queued);
    if (isCentred(travelAxis(mover)) && !canStep(maze, mover, mover.dir, walkable)) break;
    const step = Math.min(remaining, toNextCentre(mover, mover.dir));
    mover = slide(maze, mover, step);
    remaining -= step;
    travelled += step;
  }
  return { ...macman, ...mover, queued, travelled };
}
