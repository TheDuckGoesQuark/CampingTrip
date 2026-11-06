import { type Cell, cellAt, type Dir, type Maze, type Point } from "./maze";
import {
  canStep,
  isCentred,
  type Mover,
  opposite,
  slide,
  STEP,
  tileOf,
  toNextCentre,
} from "./movement";

export type GhostName = "blinky" | "pinky" | "inky" | "clyde";

export const GHOST_NAMES: readonly GhostName[] = ["blinky", "pinky", "inky", "clyde"];

export type GhostMode = "house" | "leaving" | "active";

export interface Ghost extends Mover {
  name: GhostName;
  mode: GhostMode;
}

export type Hunt = "scatter" | "chase";

/** The arcade's tie-break order when two ways are equally good. */
export const DIRS: readonly Dir[] = ["up", "left", "down", "right"];

/** Off the board, so a scattering ghost circles the block nearest it rather than stopping. */
export const CORNERS: Readonly<Record<GhostName, Point>> = {
  blinky: { x: 25, y: -3 },
  pinky: { x: 2, y: -3 },
  inky: { x: 27, y: 31 },
  clyde: { x: 0, y: 31 },
};

/** In tiles: closer than this, Clyde gives up the chase for his corner. */
export const CLYDE_NERVE = 8;

/**
 * Four tiles where a ghost hunting or scattering may not turn up: above the
 * house, and above MacMan's spawn. It is what makes those corridors safe.
 */
const NO_UP = new Set(["12,11", "15,11", "12,23", "15,23"]);

const ahead = (at: Point, dir: Dir, tiles: number): Point => ({
  x: at.x + STEP[dir].x * tiles,
  y: at.y + STEP[dir].y * tiles,
});

const distanceSquared = (a: Point, b: Point) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

/** What the hunt needs to know: MacMan's tile and heading, and Blinky's tile for Inky. */
export interface Quarry {
  tile: Point;
  dir: Dir;
  blinky: Point;
}

/** The tile each ghost steers for while hunting. Their rules are their personalities. */
export function chaseTarget(name: GhostName, self: Point, quarry: Quarry): Point {
  switch (name) {
    case "blinky":
      return quarry.tile;
    case "pinky":
      return ahead(quarry.tile, quarry.dir, 4);
    case "inky": {
      // Two tiles ahead of MacMan, then as far again past it as Blinky is behind it.
      const pivot = ahead(quarry.tile, quarry.dir, 2);
      return { x: 2 * pivot.x - quarry.blinky.x, y: 2 * pivot.y - quarry.blinky.y };
    }
    case "clyde":
      return distanceSquared(self, quarry.tile) > CLYDE_NERVE ** 2 ? quarry.tile : CORNERS.clyde;
  }
}

export function targetOf(ghost: Ghost, hunt: Hunt, quarry: Quarry, maze: Maze): Point {
  return hunt === "scatter"
    ? CORNERS[ghost.name]
    : chaseTarget(ghost.name, tileOf(maze, ghost), quarry);
}

const roams = (cell: Cell) => cell === "floor" || cell === "tunnel";

/**
 * The way a ghost goes from the centre of a tile: never back, never up through
 * a no-up tile, and otherwise whichever next tile is nearest its target in a
 * straight line, ties going up, left, down, right.
 */
export function chooseDir(maze: Maze, ghost: Mover, target: Point): Dir {
  const tile = tileOf(maze, ghost);
  const options = DIRS.filter(
    (dir) =>
      dir !== opposite(ghost.dir) &&
      !(dir === "up" && NO_UP.has(`${tile.x},${tile.y}`)) &&
      canStep(maze, ghost, dir, roams),
  );
  if (options.length === 0) return opposite(ghost.dir);
  let best = options[0];
  for (const dir of options.slice(1)) {
    if (
      distanceSquared(ahead(tile, dir, 1), target) < distanceSquared(ahead(tile, best, 1), target)
    ) {
      best = dir;
    }
  }
  return best;
}

export function roam(maze: Maze, ghost: Ghost, distance: number, target: Point): Ghost {
  let mover: Mover = { x: ghost.x, y: ghost.y, dir: ghost.dir };
  let remaining = distance;
  while (remaining > 1e-9) {
    if (isCentred(mover.x) && isCentred(mover.y)) {
      mover = { ...mover, dir: chooseDir(maze, mover, target) };
    }
    const step = Math.min(remaining, toNextCentre(mover, mover.dir));
    mover = slide(maze, mover, step);
    remaining -= step;
  }
  return { ...ghost, ...mover };
}

/** How far above and below its spawn a waiting ghost bobs. */
const BOB = 0.5;

/** A waiting ghost bobs in its bay; a leaving one slides to the door's column, then up and out. */
export function inHouse(maze: Maze, ghost: Ghost, distance: number): Ghost {
  if (ghost.mode === "house") {
    const home = maze.spawns[ghost.name];
    let dir: Dir = ghost.dir === "down" ? "down" : "up";
    if (ghost.y <= home.y - BOB) dir = "down";
    if (ghost.y >= home.y + BOB) dir = "up";
    return { ...ghost, dir, y: ghost.y + (dir === "down" ? distance : -distance) };
  }
  const out = maze.spawns.blinky;
  if (ghost.x !== out.x) {
    const dir: Dir = ghost.x < out.x ? "right" : "left";
    const x =
      dir === "right" ? Math.min(out.x, ghost.x + distance) : Math.max(out.x, ghost.x - distance);
    return { ...ghost, dir, x };
  }
  const y = ghost.y - distance;
  return y <= out.y
    ? { ...ghost, mode: "active", dir: "left", y: out.y }
    : { ...ghost, dir: "up", y };
}

/** Close enough to have met this tick; at both speeds combined, neither can pass through this. */
export function touching(maze: Maze, a: Point, b: Point): boolean {
  const dx = Math.abs(a.x - b.x);
  const wrapped = Math.min(dx, maze.width - dx);
  return wrapped < 0.75 && Math.abs(a.y - b.y) < 0.75;
}

export function isTunnel(maze: Maze, at: Point): boolean {
  const tile = tileOf(maze, at);
  return cellAt(maze, tile.x, tile.y) === "tunnel";
}
