import type { KeyboardEvent, MouseEvent } from "react";

import type { Actions } from "../engine/actions";
import { type Command, commandFor } from "./keyboard";

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
      // The initials field takes its own letters, Space and Enter.
      if (event.target instanceof HTMLInputElement) return;
      const command = commandFor(event.key);
      if (!command) return;
      // The arrows would otherwise scroll the window, and Space page it.
      event.preventDefault();
      if (command.kind === "primary" && "start" in actions) onStart();
      perform(command, actions);
    },
    onClick(event: MouseEvent) {
      if (event.target instanceof HTMLInputElement) return;
      if ("start" in actions) onStart();
      perform({ kind: "primary" }, actions);
    },
    /** Leaving the game mid-play pauses it, so nobody dies while reading the menu bar. */
    onBlur() {
      if (actions.phase === "playing") actions.pause();
    },
  };
}
