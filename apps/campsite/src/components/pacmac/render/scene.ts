import type { Dir, Food, Maze, Point } from "../engine/maze";
import type { FruitName, GhostName } from "../sprites/manifest";

export type GhostLook = "normal" | "frightened" | "flashing" | "eyes";

export interface ActorView extends Point {
  dir: Dir;
}

/** Everything the board shows in one frame: what the renderer reads, and all it reads. */
export interface Scene {
  food: readonly Food[];
  macman: ActorView & {
    /** Counts up as he moves, and the mouth follows it. */
    chomp: number;
    /** How far through dying, 0 to 1, or `null` while alive. */
    dying: number | null;
  };
  ghosts: readonly (ActorView & { name: GhostName; look: GhostLook })[];
  fruit: (Point & { name: FruitName }) | null;
  /** Power pellets blink, so this is off on alternate beats. */
  powerLit: boolean;
  /** The walls flash white once the board is cleared. */
  mazeFlash: boolean;
  /** Ticks since the board was dealt, for everything that animates on a clock. */
  clock: number;
}

/** The board as dealt: every actor on its spawn, nothing moving. */
export function dealtScene(maze: Maze): Scene {
  const { spawns } = maze;
  return {
    food: maze.food,
    macman: { ...spawns.macman, dir: "left", chomp: 0, dying: null },
    ghosts: [
      { ...spawns.blinky, name: "blinky", dir: "left", look: "normal" },
      { ...spawns.pinky, name: "pinky", dir: "down", look: "normal" },
      { ...spawns.inky, name: "inky", dir: "up", look: "normal" },
      { ...spawns.clyde, name: "clyde", dir: "up", look: "normal" },
    ],
    fruit: null,
    powerLit: true,
    mazeFlash: false,
    clock: 0,
  };
}
