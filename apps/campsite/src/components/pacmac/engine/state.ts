import type { MacManState } from "./macman";
import { type Dir, type Food, MAZE } from "./maze";

/** One board's worth of play: what is left on it and where everyone is. */
export interface Round {
  food: readonly Food[];
  score: number;
  macman: MacManState;
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
  | { phase: "paused"; round: Round };

export type Phase = GameState["phase"];

export type StateIn<P extends Phase> = Extract<GameState, { phase: P }>;

export type Action =
  | { type: "tick" }
  | { type: "start" }
  | { type: "move"; dir: Dir }
  | { type: "pause" }
  | { type: "resume" };

export function dealRound(): Round {
  return {
    food: MAZE.food,
    score: 0,
    macman: { ...MAZE.spawns.macman, dir: "left", queued: null, stall: 0, travelled: 0 },
    clock: 0,
  };
}

export function initialState(): GameState {
  return { phase: "attract", round: dealRound() };
}
