import { render, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { useSessionStore } from "../../store/sessionStore";
import { useTimeStore } from "../../store/timeStore";
import AmbienceAudio from "./AmbienceAudio";

const setAmbienceMix = vi.fn();
const startAmbience = vi.fn();
const stopAmbience = vi.fn();

vi.mock("../../audio/ambienceBeds", () => ({
  startAmbience: () => startAmbience(),
  setAmbienceMix: (t: unknown, f?: number) => setAmbienceMix(t, f),
  stopAmbience: (f?: number) => stopAmbience(f),
}));

/** timeStore progress values, per its 0 = 6 AM mapping. */
const NOON = 0.25;
const MIDNIGHT = 0.75;
const MID_DUSK = 0.5; // getNightFactor smoothsteps to exactly 0.5 here

function setUp(opts: { progress: number; enabled?: boolean }) {
  useSessionStore.setState({ ambienceEnabled: opts.enabled ?? true });
  useTimeStore.setState({ progress: opts.progress });
}

function lastMix() {
  const calls = setAmbienceMix.mock.calls;
  return calls[calls.length - 1][0] as { rain: number; day: number };
}

describe("AmbienceAudio", () => {
  beforeEach(() => {
    setAmbienceMix.mockClear();
    startAmbience.mockClear();
    stopAmbience.mockClear();
  });

  it("plays only birdsong at noon", () => {
    setUp({ progress: NOON });
    render(<AmbienceAudio />);

    expect(lastMix().rain).toBe(0);
    expect(lastMix().day).toBeGreaterThan(0);
  });

  it("plays only rain at midnight", () => {
    setUp({ progress: MIDNIGHT });
    render(<AmbienceAudio />);

    expect(lastMix().day).toBe(0);
    expect(lastMix().rain).toBeGreaterThan(0);
  });

  it("holds both beds at half gain mid-dusk, so neither drops out", () => {
    setUp({ progress: MID_DUSK });
    render(<AmbienceAudio />);
    const dusk = lastMix();

    setAmbienceMix.mockClear();
    setUp({ progress: MIDNIGHT });
    render(<AmbienceAudio />);
    const night = lastMix();

    expect(dusk.rain).toBeCloseTo(night.rain / 2);
    expect(dusk.day).toBeGreaterThan(0);
  });

  it("crossfades as the day turns, without silence in between", () => {
    setUp({ progress: NOON });
    const { rerender } = render(<AmbienceAudio />);

    for (const progress of [0.46, 0.48, 0.5, 0.52, 0.54]) {
      act(() => useTimeStore.setState({ progress }));
      rerender(<AmbienceAudio />);
      const { rain, day } = lastMix();
      expect(rain + day).toBeGreaterThan(0);
    }

    expect(lastMix().day).toBe(0);
  });

  it("stops the beds and sets no mix while ambience is off", () => {
    setUp({ progress: MIDNIGHT, enabled: false });
    render(<AmbienceAudio />);

    expect(stopAmbience).toHaveBeenCalled();
    expect(startAmbience).not.toHaveBeenCalled();
    expect(setAmbienceMix).not.toHaveBeenCalled();
  });

  it("starts the beds before setting their mix when switched on", () => {
    setUp({ progress: MIDNIGHT, enabled: false });
    const { rerender } = render(<AmbienceAudio />);

    act(() => useSessionStore.setState({ ambienceEnabled: true }));
    rerender(<AmbienceAudio />);

    expect(startAmbience).toHaveBeenCalled();
    expect(startAmbience.mock.invocationCallOrder[0]).toBeLessThan(
      setAmbienceMix.mock.invocationCallOrder[0],
    );
  });
});
