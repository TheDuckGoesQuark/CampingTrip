import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mobileInput } from "../../../mobileInput";
import type { Actions } from "../engine/actions";
import { useJoystick } from "./useJoystick";

const frame = () => act(() => vi.advanceTimersByTime(20));

describe("useJoystick", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
    Object.assign(mobileInput, { x: 0, y: 0, active: false });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.assign(mobileInput, { x: 0, y: 0, active: false });
  });

  it("asks for a turn when the knob takes a new direction, once", () => {
    const move = vi.fn();
    const actions: Actions = { phase: "playing", move, pause: vi.fn() };
    renderHook(() => useJoystick(actions));
    Object.assign(mobileInput, { x: 0, y: -0.9, active: true });
    frame();
    frame();
    Object.assign(mobileInput, { x: 0.9, y: 0 });
    frame();
    expect(move.mock.calls).toEqual([["up"], ["right"]]);
  });

  it("does nothing outside play", () => {
    const start = vi.fn();
    renderHook(() => useJoystick({ phase: "attract", start }));
    Object.assign(mobileInput, { x: 0.9, y: 0, active: true });
    frame();
    expect(start).not.toHaveBeenCalled();
  });
});
