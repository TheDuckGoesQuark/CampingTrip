import { useEffect, useRef } from "react";

import { useSessionStore } from "../../../store/sessionStore";
import { countFood, MAZE } from "../engine/maze";
import type { GameState } from "../engine/state";
import { cuesBetween, sirenLevel } from "./cues";
import { play, setSiren } from "./sound";

const BOARD_FOOD = countFood(MAZE.food, "pellet") + countFood(MAZE.food, "power");

/** Plays what each new state calls for, and keeps the siren in step with the board. */
export function useGameSound(state: GameState): void {
  const previous = useRef(state);
  const soundEnabled = useSessionStore((s) => s.soundEnabled);

  useEffect(() => {
    for (const cue of cuesBetween(previous.current, state)) play(cue);
    previous.current = state;
  }, [state]);

  // Quantised, so the effect reruns when the pitch would move, not on every tick.
  const level = sirenLevel(state, BOARD_FOOD);
  const step = level === null ? null : Math.round(level * 40) / 40;
  useEffect(() => {
    setSiren(soundEnabled ? step : null);
  }, [step, soundEnabled]);
  useEffect(() => () => setSiren(null), []);
}
