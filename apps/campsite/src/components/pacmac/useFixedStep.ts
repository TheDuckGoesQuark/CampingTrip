import { useEffect } from "react";

import { TICKS_PER_SECOND } from "./engine/rules";

const STEP_MS = 1000 / TICKS_PER_SECOND;

/** A frame later than this is a tab coming back from the background, not lag to catch up. */
const MAX_STEPS_PER_FRAME = 5;

/**
 * Calls `step` at the engine's fixed rate, driven by animation frames, so the
 * game runs at one speed on a 60Hz screen and a 144Hz one alike. `step` should
 * keep its identity, or the loop restarts.
 */
export function useFixedStep(step: () => void): void {
  useEffect(() => {
    let frame = 0;
    let last: number | null = null;
    let owed = 0;
    const loop = (now: number) => {
      if (last !== null) owed = Math.min(owed + now - last, STEP_MS * MAX_STEPS_PER_FRAME);
      last = now;
      while (owed >= STEP_MS) {
        step();
        owed -= STEP_MS;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [step]);
}
