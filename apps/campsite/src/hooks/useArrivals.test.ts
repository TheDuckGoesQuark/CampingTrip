import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { watchIntersections } from "../test/intersection";
import { useArrivals } from "./useArrivals";

const SETTLE = 500;

let observers: ReturnType<typeof watchIntersections>;

const wait = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

/** A ref built once, or every render would hand the effect a new one to chase. */
function watch() {
  const ref = { current: document.createElement("footer") };
  return renderHook(({ restart }) => useArrivals(ref, SETTLE, restart), {
    initialProps: { restart: 0 },
  });
}

describe("useArrivals", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    observers = watchIntersections();
  });

  afterEach(() => {
    vi.useRealTimers();
    observers.restore();
  });

  it("counts nothing while the element has never been seen", () => {
    const { result } = watch();
    wait(SETTLE * 10);
    expect(result.current).toBe(0);
  });

  it("counts an arrival once the element has stayed in view for the whole wait", () => {
    const { result } = watch();
    observers.send(true);
    wait(SETTLE - 1);
    expect(result.current).toBe(0);
    wait(1);
    expect(result.current).toBe(1);
  });

  it("does not count a glance on the way past", () => {
    const { result } = watch();
    observers.send(true);
    wait(SETTLE - 1);
    observers.send(false);
    wait(SETTLE * 10);
    expect(result.current).toBe(0);
  });

  it("counts a second arrival for someone who left and came back", () => {
    const { result } = watch();
    observers.send(true);
    wait(SETTLE);
    observers.send(false);
    observers.send(true);
    wait(SETTLE);
    expect(result.current).toBe(2);
  });

  it("does not count again for someone who simply stayed", () => {
    const { result } = watch();
    observers.send(true);
    wait(SETTLE * 20);
    expect(result.current).toBe(1);
  });

  it("counts an arrival when restart is bumped without the element leaving", () => {
    const { result, rerender } = watch();
    observers.send(true);
    wait(SETTLE);
    expect(result.current).toBe(1);
    rerender({ restart: 1 });
    wait(SETTLE);
    expect(result.current).toBe(2);
  });

  it("waits for the element before honouring a restart", () => {
    const { result, rerender } = watch();
    rerender({ restart: 1 });
    wait(SETTLE * 10);
    expect(result.current).toBe(0);
    observers.send(true);
    wait(SETTLE);
    expect(result.current).toBe(1);
  });

  it("counts a restart answered by a scroll only once", () => {
    const { result, rerender } = watch();
    rerender({ restart: 1 });
    wait(SETTLE - 1);
    observers.send(true);
    wait(SETTLE * 10);
    expect(result.current).toBe(1);
  });
});
