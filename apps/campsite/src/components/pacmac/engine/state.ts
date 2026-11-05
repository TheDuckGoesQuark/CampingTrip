import { GHOST_NAMES, type Ghost, type GhostName, type Hunt } from "./ghosts";
import type { MacManState } from "./macman";
import { type Dir, type Food, MAZE } from "./maze";
import { HUNT_SCHEDULE, LIVES } from "./rules";

/** One board's worth of play: what is left on it and where everyone is. */
export interface Round {
  food: readonly Food[];
  score: number;
  /** Including the one being played. */
  lives: number;
  macman: MacManState;
  ghosts: Readonly<Record<GhostName, Ghost>>;
  /** Which part of the scatter-chase schedule the ghosts are in, and for how much longer. */
  hunt: { kind: Hunt; stage: number; ticksLeft: number };
  /** What decides the next ghost out: pellets eaten this life, and ticks since the last. */
  house: { dots: number; idle: number; afterDeath: boolean };
  /** Ticks of play since the board was dealt; still while paused or getting ready. */
  clock: number;
}

/**
 * Every phase carries the round, so the board can be drawn in any of them,
 * the attract screen's included. Plain data throughout: no functions, so a
 * state can be compared, logged and replayed.
 */
export type GameState =
  | { phase: "attract"; round: Round }
  | { phase: "ready"; round: Round; ticksLeft: number }
  | { phase: "playing"; round: Round }
  | { phase: "paused"; round: Round }
  | { phase: "dying"; round: Round; ticksLeft: number }
  | { phase: "levelCleared"; round: Round; ticksLeft: number }
  | { phase: "won"; round: Round }
  | { phase: "gameOver"; round: Round };

export type Phase = GameState["phase"];

export type StateIn<P extends Phase> = Extract<GameState, { phase: P }>;

export type Action =
  | { type: "tick" }
  | { type: "start" }
  | { type: "move"; dir: Dir }
  | { type: "pause" }
  | { type: "resume" };

const DEALT_DIRS: Readonly<Record<GhostName, Dir>> = {
  blinky: "left",
  pinky: "down",
  inky: "up",
  clyde: "up",
};

function dealtGhosts(): Record<GhostName, Ghost> {
  return Object.fromEntries(
    GHOST_NAMES.map((name) => [
      name,
      {
        ...MAZE.spawns[name],
        name,
        dir: DEALT_DIRS[name],
        mode: name === "blinky" ? "active" : "house",
      },
    ]),
  ) as Record<GhostName, Ghost>;
}

type Kept = Pick<Round, "food" | "score" | "lives" | "clock">;

/** Everyone back on their spawn, as at the start of a board or a life. */
export function respawn(kept: Kept, afterDeath: boolean): Round {
  return {
    ...kept,
    macman: { ...MAZE.spawns.macman, dir: "left", queued: null, stall: 0, travelled: 0 },
    ghosts: dealtGhosts(),
    hunt: { kind: "scatter", stage: 0, ticksLeft: HUNT_SCHEDULE[0] },
    house: { dots: 0, idle: 0, afterDeath },
  };
}

export function dealRound(): Round {
  return respawn({ food: MAZE.food, score: 0, lives: LIVES, clock: 0 }, false);
}

export function initialState(): GameState {
  return { phase: "attract", round: dealRound() };
}
