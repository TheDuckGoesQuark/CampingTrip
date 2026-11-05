import type { FruitName } from "../engine/fruit";
import { type Ghost, GHOST_NAMES, type GhostName } from "../engine/ghosts";
import type { Dir, Food, Maze, Point } from "../engine/maze";
import { BLINK_TICKS, DEATH_SPIN_TICKS, FRIGHT_FLASH_TICKS, seconds } from "../engine/rules";
import type { GameState, Round } from "../engine/state";

/** Ticks per white flash of the walls once the board is cleared. */
const FLASH_TICKS = seconds(0.25);

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
  /** Points just scored, where they were scored. */
  popups: readonly (Point & { points: number })[];
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
    popups: [],
    powerLit: true,
    mazeFlash: false,
    clock: 0,
  };
}

/** Strides of the mouth per tile moved: a full open-and-shut every tile and a third. */
const CHOMPS_PER_TILE = 3;

function lookOf(ghost: Ghost, round: Round): GhostLook {
  if (ghost.mode === "eyes" || ghost.mode === "entering") return "eyes";
  if (!ghost.scared || !round.fright) return "normal";
  return round.fright.ticksLeft <= FRIGHT_FLASH_TICKS ? "flashing" : "frightened";
}

/** How far through the spin a dying MacMan is, or `null` before it starts or while alive. */
function dyingProgress(state: GameState): number | null {
  if (state.phase !== "dying" || state.ticksLeft > DEATH_SPIN_TICKS) return null;
  return 1 - state.ticksLeft / DEATH_SPIN_TICKS;
}

/** What the board shows for a game state. Read-only: the renderer's whole view of the game. */
export function sceneOf(state: GameState, maze: Maze): Scene {
  const { round } = state;
  const { macman } = round;
  const dying = dyingProgress(state);
  return {
    food: round.food,
    macman: {
      x: macman.x,
      y: macman.y,
      dir: macman.dir,
      chomp: Math.floor(macman.travelled * CHOMPS_PER_TILE),
      dying,
    },
    // They vanish once he starts to spin, as in the arcade, so the death reads.
    ghosts:
      dying === null
        ? GHOST_NAMES.map((name) => {
            const ghost = round.ghosts[name];
            return { x: ghost.x, y: ghost.y, dir: ghost.dir, name, look: lookOf(ghost, round) };
          })
        : [],
    fruit: round.fruit && { ...maze.spawns.fruit, name: round.fruit.name },
    popups: round.popups.map(({ x, y, points }) => ({ x, y, points })),
    powerLit: state.phase !== "playing" || Math.floor(round.clock / BLINK_TICKS) % 2 === 0,
    mazeFlash:
      state.phase === "levelCleared" && Math.floor(state.ticksLeft / FLASH_TICKS) % 2 === 1,
    clock: round.clock,
  };
}
