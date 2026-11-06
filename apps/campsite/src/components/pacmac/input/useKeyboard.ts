import type { FocusEvent, KeyboardEvent, MouseEvent } from "react";

import type { Actions } from "../engine/actions";
import { isHapticSwitch } from "./haptics";
import { type Command, commandFor } from "./keyboard";
import { fromControl } from "./useTouch";

/**
 * Space is the one button the attract and pause screens ask for: it starts,
 * pauses and resumes, whichever the phase allows. On a touch screen, a tap on
 * the board is that button.
 */
export function perform(command: Command, actions: Actions): void {
  switch (actions.phase) {
    case "attract":
    case "won":
    case "gameOver":
      if (command.kind === "primary") actions.start();
      return;
    case "playing":
      if (command.kind === "move") actions.move(command.dir);
      else actions.pause();
      return;
    case "paused":
      if (command.kind !== "move") actions.resume();
      return;
    case "ready":
      if (command.kind === "move") actions.move(command.dir);
      return;
    case "dying":
    case "levelCleared":
      return;
  }
}

/**
 * Handlers for the game's focusable element. They only ever call `actions`,
 * and `onStart`, which runs inside the key press that starts a game, where a
 * browser lets audio begin.
 */
export function useKeyboard(actions: Actions, onStart: () => void = () => {}) {
  return {
    onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (fromControl(event.target)) return;
      const command = commandFor(event.key);
      if (!command) return;
      // The arrows would otherwise scroll the window, and Space page it.
      event.preventDefault();
      if (command.kind === "primary" && "start" in actions) onStart();
      perform(command, actions);
    },
    onClick(event: MouseEvent) {
      if (fromControl(event.target)) return;
      if ("start" in actions) onStart();
      perform({ kind: "primary" }, actions);
    },
    /** Leaving the game mid-play pauses it, so nobody dies while reading the menu bar. */
    onBlur(event: FocusEvent) {
      // Focus moving to the pause button, inside the screen, or to the haptic switch is not leaving.
      const to = event.relatedTarget;
      if (isHapticSwitch(to) || (to instanceof Node && event.currentTarget.contains(to))) return;
      if (actions.phase === "playing") actions.pause();
    },
  };
}
