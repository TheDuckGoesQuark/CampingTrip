import type { KeyboardEvent } from "react";

import type { Actions } from "../engine/actions";
import { type Command, commandFor } from "./keyboard";

/**
 * Space is the one button the attract and pause screens ask for: it starts,
 * pauses and resumes, whichever the phase allows.
 */
function perform(command: Command, actions: Actions): void {
  switch (actions.phase) {
    case "attract":
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
      return;
  }
}

/** Handlers for the game's focusable element. They only ever call `actions`. */
export function useKeyboard(actions: Actions) {
  return {
    onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const command = commandFor(event.key);
      if (!command) return;
      // The arrows would otherwise scroll the window, and Space page it.
      event.preventDefault();
      perform(command, actions);
    },
    /** Leaving the game mid-play pauses it, so nobody dies while reading the menu bar. */
    onBlur() {
      if (actions.phase === "playing") actions.pause();
    },
  };
}
