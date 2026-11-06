import type { Dir } from "./maze";
import type { Action, GameState, Phase } from "./state";

/** What the player may do in each phase, and nothing else. */
export interface PhaseActions {
  attract: { start(): void };
  ready: Record<never, never>;
  playing: { move(dir: Dir): void; pause(): void };
  paused: { resume(): void };
  dying: Record<never, never>;
  levelCleared: Record<never, never>;
  won: { start(): void };
  gameOver: { start(): void };
}

/** The actions for one phase, tagged with it so a caller can narrow by it. */
export type Actions<P extends Phase = Phase> = {
  [Q in P]: { phase: Q } & PhaseActions[Q];
}[P];

export type Dispatch = (action: Action) => void;

export function actionsForPhase<P extends Phase>(phase: P, dispatch: Dispatch): Actions<P>;
export function actionsForPhase(phase: Phase, dispatch: Dispatch): Actions {
  switch (phase) {
    case "attract":
    case "won":
    case "gameOver":
      return { phase, start: () => dispatch({ type: "start" }) };
    case "ready":
    case "dying":
    case "levelCleared":
      return { phase };
    case "playing":
      return {
        phase,
        move: (dir) => dispatch({ type: "move", dir }),
        pause: () => dispatch({ type: "pause" }),
      };
    case "paused":
      return { phase, resume: () => dispatch({ type: "resume" }) };
  }
}

/**
 * The legal actions for a state, so the state dictates what can be done: a
 * `move` exists only while playing, and its type says so.
 */
export function actionsFor<S extends GameState>(state: S, dispatch: Dispatch): Actions<S["phase"]>;
export function actionsFor(state: GameState, dispatch: Dispatch): Actions {
  return actionsForPhase(state.phase, dispatch);
}
