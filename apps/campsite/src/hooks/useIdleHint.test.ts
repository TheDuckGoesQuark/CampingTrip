import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useIdleHint } from "./useIdleHint";

const DELAY = 8000;

/** A real event, so the hook's own listeners are what gets exercised. */
function stir(type = "pointermove") {
  act(() => {
    window.dispatchEvent(new Event(type));
  });
}
const wait = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

describe("useIdleHint", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("stays quiet until the delay has passed", () => {
    const { result } = renderHook(() => useIdleHint(true, DELAY));
    expect(result.current).toBe(false);
    wait(DELAY - 1);
    expect(result.current).toBe(false);
    wait(1);
    expect(result.current).toBe(true);
  });

  it("never fires while disarmed, however long the wait", () => {
    const { result } = renderHook(() => useIdleHint(false, DELAY));
    wait(DELAY * 3);
    expect(result.current).toBe(false);
  });

  it("starts counting from scratch when it is armed", () => {
    const { result, rerender } = renderHook(({ armed }) => useIdleHint(armed, DELAY), {
      initialProps: { armed: false },
    });
    // The whole point of the `armed` gate: a hint that had been counting down
    // behind an overlay would fire the instant one closed.
    wait(DELAY);
    rerender({ armed: true });
    wait(DELAY - 1);
    expect(result.current).toBe(false);
    wait(1);
    expect(result.current).toBe(true);
  });

  it("withdraws the moment the visitor does anything, then waits again", () => {
    const { result } = renderHook(() => useIdleHint(true, DELAY));
    wait(DELAY);
    expect(result.current).toBe(true);

    stir();
    expect(result.current).toBe(false);
    wait(DELAY - 1);
    expect(result.current).toBe(false);
    wait(1);
    expect(result.current).toBe(true);
  });

  it.each(["pointerdown", "pointermove", "keydown", "wheel", "touchstart"])(
    "counts %s as the visitor still being here",
    (type) => {
      const { result } = renderHook(() => useIdleHint(true, DELAY));
      wait(DELAY - 1);
      stir(type);
      // Reset rather than elapsed, so the last 1ms no longer completes the wait.
      wait(1);
      expect(result.current).toBe(false);
    },
  );

  it("drops its timer and its listeners when it goes away", () => {
    const { result, unmount } = renderHook(() => useIdleHint(true, DELAY));
    unmount();
    wait(DELAY);
    expect(result.current).toBe(false);
    // Would throw on a setState after unmount if the listeners had outlived it.
    stir();
  });
});
