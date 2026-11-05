import { useEffect, useRef } from "react";

import { mobileInput } from "../../../mobileInput";
import type { Actions } from "../engine/actions";
import { dirOf } from "./joystick";

/**
 * Reads the site's virtual joystick every frame and asks for a turn when its
 * direction changes. The joystick writes a shared object rather than calling
 * anything, so polling is how it is read; the tent's camera reads it the same way.
 */
export function useJoystick(actions: Actions): void {
  const latest = useRef(actions);
  useEffect(() => {
    latest.current = actions;
  }, [actions]);

  useEffect(() => {
    let frame = 0;
    let held: string | null = null;
    const read = () => {
      const dir = mobileInput.active ? dirOf(mobileInput.x, mobileInput.y) : null;
      const actions = latest.current;
      if (dir !== held && dir !== null && actions.phase === "playing") actions.move(dir);
      held = dir;
      frame = requestAnimationFrame(read);
    };
    frame = requestAnimationFrame(read);
    return () => cancelAnimationFrame(frame);
  }, []);
}
