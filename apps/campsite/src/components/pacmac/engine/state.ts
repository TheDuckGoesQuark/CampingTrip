import type { FruitName } from "./fruit";
import { GHOST_NAMES, type Ghost, type GhostName, type Hunt } from "./ghosts";
import type { MacManState } from "./macman";
import { type Dir, type Food, MAZE, type Point } from "./maze";
import { HUNT_SCHEDULE, LIVES } from "./rules";

/** Points shown where they were scored, for a moment. */
export interface Popup extends Point {
  points: number;
  ticksLeft: number;
}

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
  /** A power pellet's effect, and how many ghosts it has paid for so far. */
  fright: { ticksLeft: number; eaten: number } | null;
  fruit: { name: FruitName; ticksLeft: number } | null;
  /** Fruit this board has offered, eaten or not, which picks the next. */
  fruitsShown: number;
  popups: readonly Popup[];
  /** Ticks everything holds still, as it does while an eaten ghost's points show. */
  freeze: number;
  /** The seed for a frightened ghost's next wander. */
  seed: number;
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
  | { type: "move"; dir: Dir; until: "lapse" | "taken" }
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
        scared: false,
      },
    ]),
  ) as Record<GhostName, Ghost>;
}

type Kept = Pick<Round, "food" | "score" | "lives" | "clock" | "fruitsShown" | "seed">;

/** Everyone back on their spawn, as at the start of a board or a life. */
export function respawn(kept: Kept, afterDeath: boolean): Round {
  return {
    ...kept,
    macman: {
      ...MAZE.spawns.macman,
      dir: "left",
      queued: null,
      lapsesAt: 0,
      stall: 0,
      travelled: 0,
    },
    ghosts: dealtGhosts(),
    hunt: { kind: "scatter", stage: 0, ticksLeft: HUNT_SCHEDULE[0] },
    house: { dots: 0, idle: 0, afterDeath },
    fright: null,
    fruit: null,
    popups: [],
    freeze: 0,
  };
}

export function dealRound(): Round {
  return respawn(
    { food: MAZE.food, score: 0, lives: LIVES, clock: 0, fruitsShown: 0, seed: 1 },
    false,
  );
}

export function initialState(): GameState {
  return { phase: "attract", round: dealRound() };
}
