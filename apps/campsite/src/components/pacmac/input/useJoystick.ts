import { useEffect, useRef } from "react";

import { mobileInput } from "../../../mobileInput";
import type { Actions } from "../engine/actions";
import { dirOf } from "./joystick";

/** Frames between asking again for a direction still held, as a held key repeats. */
const REPEAT_FRAMES = 8;

/**
 * Reads the site's virtual joystick every frame and asks for a turn when its
 * direction changes, and again while it is held, since a turn asked for once
 * lapses. The joystick writes a shared object rather than calling anything, so
 * polling is how it is read; the tent's camera reads it the same way.
 */
export function useJoystick(actions: Actions): void {
  const latest = useRef(actions);
  useEffect(() => {
    latest.current = actions;
  }, [actions]);

  useEffect(() => {
    let frame = 0;
    let held: string | null = null;
    let since = 0;
    const read = () => {
      const dir = mobileInput.active ? dirOf(mobileInput.x, mobileInput.y) : null;
      const actions = latest.current;
      since = dir === held ? since + 1 : 0;
      const ask = dir !== null && (dir !== held || since % REPEAT_FRAMES === 0);
      if (ask && "move" in actions) actions.move(dir);
      held = dir;
      frame = requestAnimationFrame(read);
    };
    frame = requestAnimationFrame(read);
    return () => cancelAnimationFrame(frame);
  }, []);
}
