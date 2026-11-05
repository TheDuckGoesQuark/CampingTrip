import { countFood } from "../engine/maze";
import { DEATH_SPIN_TICKS } from "../engine/rules";
import type { GameState } from "../engine/state";

/** "Mac" on one pellet and "ka" on the next, so a corridor eaten in a run says MackaMackaMacka. */
export type Syllable = "mac" | "ka";

export type Cue =
  | { kind: "bite"; syllable: Syllable }
  | { kind: "start" }
  | { kind: "death" }
  | { kind: "fruit" }
  | { kind: "ghostEaten" };

const foodLeft = (state: GameState) =>
  countFood(state.round.food, "pellet") + countFood(state.round.food, "power");

/**
 * The one-shot sounds a step from one state to the next calls for. Pure, so
 * what the game says and when is tested without any audio.
 */
export function cuesBetween(before: GameState, after: GameState): Cue[] {
  const cues: Cue[] = [];
  const startedFrom =
    before.phase === "attract" || before.phase === "won" || before.phase === "gameOver";
  if (startedFrom && after.phase === "ready") cues.push({ kind: "start" });

  const left = foodLeft(after);
  if (before.phase === "playing" && left < foodLeft(before)) {
    cues.push({ kind: "bite", syllable: left % 2 === 0 ? "mac" : "ka" });
  }
  if ((after.round.fright?.eaten ?? 0) > (before.round.fright?.eaten ?? 0)) {
    cues.push({ kind: "ghostEaten" });
  }
  if (before.round.fruit && !after.round.fruit && after.round.score > before.round.score) {
    cues.push({ kind: "fruit" });
  }
  if (after.phase === "dying" && after.ticksLeft === DEATH_SPIN_TICKS) cues.push({ kind: "death" });
  return cues;
}

/** The siren's pitch, 0 on a full board to 1 on an empty one, or `null` for silence. */
export function sirenLevel(state: GameState, boardFood: number): number | null {
  if (state.phase !== "playing") return null;
  return 1 - foodLeft(state) / boardFood;
}
