import { type TouchEvent, useRef } from "react";

import type { Dir } from "../engine/maze";
import { tick } from "./haptics";
import { swipeDir } from "./swipe";

interface Gesture {
  finger: number;
  x: number;
  y: number;
  last: Dir | null;
}

const fingerIn = (event: TouchEvent, finger: number) =>
  Array.from(event.changedTouches).find((touch) => touch.identifier === finger);

/**
 * Touch handlers for the screen: a swipe asks for that turn as soon as it is
 * long enough, and a finger that keeps moving can ask for another, so one
 * stroke round a corner is two turns.
 */
export function useSwipe(onSwipe: (dir: Dir) => void) {
  const gesture = useRef<Gesture | null>(null);
  return {
    onTouchStart(event: TouchEvent) {
      if (gesture.current) return;
      const touch = event.changedTouches[0];
      gesture.current = {
        finger: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        last: null,
      };
    },
    onTouchMove(event: TouchEvent) {
      const current = gesture.current;
      const touch = current && fingerIn(event, current.finger);
      if (!current || !touch) return;
      const dir = swipeDir(touch.clientX - current.x, touch.clientY - current.y);
      if (!dir) return;
      current.x = touch.clientX;
      current.y = touch.clientY;
      if (dir === current.last) return;
      current.last = dir;
      tick("press");
      onSwipe(dir);
    },
    onTouchEnd(event: TouchEvent) {
      const current = gesture.current;
      if (!current || !fingerIn(event, current.finger)) return;
      if (current.last) tick("release");
      gesture.current = null;
    },
    onTouchCancel() {
      gesture.current = null;
    },
  };
}
