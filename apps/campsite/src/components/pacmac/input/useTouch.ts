import { type MouseEvent, type PointerEvent, type RefObject, useRef } from "react";

import type { Actions } from "../engine/actions";
import type { Dir } from "../engine/maze";
import { tick } from "./haptics";
import { padDir, swipeDir } from "./swipe";

/** Long enough for the click that follows a tap; short enough to miss the next one. */
const CLICK_AFTER_TAP_MS = 800;

interface Gesture {
  pointer: number;
  /** Where the finger was when it last asked for a turn, or touched down. */
  x: number;
  y: number;
  /** The turn this stroke last asked for; `null` while it is still a tap. */
  last: Dir | null;
  onPad: boolean;
}

/** The initials form and the pause button take their own taps. */
export const fromControl = (target: EventTarget | null) =>
  target instanceof Element && target.closest("form, button") !== null;

export interface TouchOptions {
  /** The area under the board that is all pad. */
  pad: RefObject<HTMLElement | null>;
  /** Runs inside the tap that starts a game, where a browser lets audio begin. */
  onStart(): void;
}

/**
 * Touch for the whole cabinet. A stroke anywhere steers once it is long enough,
 * and asks again each time it changes direction. A finger lifted without
 * having moved is a tap: on the pad's area, the arm under it; elsewhere, the
 * start or resume button, but never pause, which a missed swipe would hit.
 * Deciding on the release is what keeps a swipe that starts on the pad from
 * also pressing the arm it started on.
 */
export function useTouch(actions: Actions, { pad, onStart }: TouchOptions) {
  const gesture = useRef<Gesture | null>(null);
  const tappedAt = useRef(-Infinity);

  const steer = (dir: Dir) => {
    if ("hold" in actions) actions.hold(dir);
  };

  const tap = (event: PointerEvent, onPad: boolean) => {
    if ("start" in actions) {
      onStart();
      actions.start();
    } else if ("resume" in actions) {
      actions.resume();
    } else if (onPad && pad.current) {
      const area = pad.current.getBoundingClientRect();
      const dir = padDir(
        event.clientX - (area.left + area.width / 2),
        event.clientY - (area.top + area.height / 2),
      );
      if (!dir) return;
      tick("press");
      steer(dir);
      tick("release");
    }
  };

  return {
    onPointerDown(event: PointerEvent) {
      if (event.pointerType === "mouse" || gesture.current || fromControl(event.target)) return;
      // Keeps focus on the game, which pauses when it blurs.
      event.preventDefault();
      gesture.current = {
        pointer: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        last: null,
        onPad: pad.current?.contains(event.target as Node) ?? false,
      };
    },
    onPointerMove(event: PointerEvent) {
      const current = gesture.current;
      if (!current || current.pointer !== event.pointerId) return;
      const dir = swipeDir(event.clientX - current.x, event.clientY - current.y);
      if (!dir) return;
      current.x = event.clientX;
      current.y = event.clientY;
      if (dir === current.last) return;
      current.last = dir;
      tick("press");
      steer(dir);
    },
    onPointerUp(event: PointerEvent) {
      const current = gesture.current;
      if (!current || current.pointer !== event.pointerId) return;
      gesture.current = null;
      tappedAt.current = event.timeStamp;
      if (current.last) tick("release");
      else tap(event, current.onPad);
    },
    onPointerCancel() {
      gesture.current = null;
    },
    /** The click a touch leaves behind is already handled, so the screen's own must not run. */
    onClickCapture(event: MouseEvent) {
      if (fromControl(event.target)) return;
      if (event.timeStamp - tappedAt.current > CLICK_AFTER_TAP_MS) return;
      tappedAt.current = -Infinity;
      event.stopPropagation();
    },
  };
}
