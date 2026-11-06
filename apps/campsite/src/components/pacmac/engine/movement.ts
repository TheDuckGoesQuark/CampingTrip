import { type Cell, cellAt, type Dir, type Maze, type Point } from "./maze";

export interface Mover extends Point {
  dir: Dir;
}

export const STEP: Readonly<Record<Dir, Point>> = {
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  down: { x: 0, y: 1 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Readonly<Record<Dir, Dir>> = {
  up: "down",
  left: "right",
  down: "up",
  right: "left",
};

export function opposite(dir: Dir): Dir {
  return OPPOSITE[dir];
}

const horizontal = (dir: Dir) => dir === "left" || dir === "right";

/** Below this, a coordinate is on a tile centre; float sums never land exactly. */
const EPSILON = 1e-6;

/** The tile a position is in, its column wrapped through the tunnel. */
export function tileOf(maze: Maze, at: Point): Point {
  const x = Math.round(at.x);
  return { x: ((x % maze.width) + maze.width) % maze.width, y: Math.round(at.y) };
}

export function isCentred(value: number): boolean {
  return Math.abs(value - Math.round(value)) < EPSILON;
}

/** Keeps a column inside the board's width, so leaving one side arrives at the other. */
export function wrapX(maze: Maze, x: number): number {
  const half = 0.5;
  if (x < -half) return x + maze.width;
  if (x >= maze.width - half) return x - maze.width;
  return x;
}

export type Passable = (cell: Cell) => boolean;

/** Whether the tile one step from the tile centred at `at` can be entered. */
export function canStep(maze: Maze, at: Point, dir: Dir, passable: Passable): boolean {
  const tile = { x: Math.round(at.x), y: Math.round(at.y) };
  return passable(cellAt(maze, tile.x + STEP[dir].x, tile.y + STEP[dir].y));
}

/** How far along `dir` to the next tile centre; a full tile when already on one. */
export function toNextCentre(at: Point, dir: Dir): number {
  const value = horizontal(dir) ? at.x : at.y;
  const forward = STEP[dir].x + STEP[dir].y > 0;
  const gap = forward ? Math.ceil(value) - value : value - Math.floor(value);
  return gap < EPSILON ? 1 : gap;
}

/** Snaps the axis across the direction of travel to its centre, as a turn does. */
export function alignFor(at: Point, dir: Dir): Point {
  return horizontal(dir) ? { x: at.x, y: Math.round(at.y) } : { x: Math.round(at.x), y: at.y };
}

/** Moves `distance` along `dir` without passing a tile centre; the caller decides at each one. */
export function slide(maze: Maze, mover: Mover, distance: number): Mover {
  const step = STEP[mover.dir];
  let x = mover.x + step.x * distance;
  let y = mover.y + step.y * distance;
  if (isCentred(x)) x = Math.round(x);
  if (isCentred(y)) y = Math.round(y);
  return { ...mover, x: wrapX(maze, x), y };
}

/** How far a mover is from the centre of the tile it is in, along its direction of travel. */
export function offCentre(at: Point, dir: Dir): number {
  const value = horizontal(dir) ? at.x : at.y;
  return Math.abs(value - Math.round(value));
}
