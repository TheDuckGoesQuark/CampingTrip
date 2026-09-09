import { render, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { useSceneStore } from "../store/sceneStore";
import { useSessionStore } from "../store/sessionStore";
import CampfireLoadingScreen from "./CampfireLoadingScreen";

const startCampfire = vi.fn();
const stopCampfire = vi.fn();

vi.mock("../audio/campfireSynth", () => ({
  startCampfire: (v?: number) => startCampfire(v),
  stopCampfire: (f?: number) => stopCampfire(f),
  isCampfirePlaying: () => startCampfire.mock.calls.length > stopCampfire.mock.calls.length,
}));

describe("CampfireLoadingScreen audio", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    startCampfire.mockClear();
    stopCampfire.mockClear();
    useSessionStore.setState({ hasCompletedWelcome: true, ambienceEnabled: true });
    useSceneStore.setState({ loadProgress: 0 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lights the campfire once the welcome is done and ambience is on", () => {
    render(<CampfireLoadingScreen />);
    expect(startCampfire).toHaveBeenCalled();
  });

  it("stays silent while ambience is off", () => {
    useSessionStore.setState({ ambienceEnabled: false });
    render(<CampfireLoadingScreen />);
    expect(startCampfire).not.toHaveBeenCalled();
  });

  // The campfire belongs to this screen, so leaving the screen must take it
  // with it. "Reset preferences" clears hasCompletedWelcome, which unmounts
  // this component from SceneRoot mid-load.
  it("puts the campfire out when the screen unmounts", () => {
    const { unmount } = render(<CampfireLoadingScreen />);
    expect(startCampfire).toHaveBeenCalled();

    unmount();
    expect(stopCampfire).toHaveBeenCalled();
  });

  it("puts the campfire out when ambience is switched off mid-load", () => {
    const { rerender } = render(<CampfireLoadingScreen />);
    expect(startCampfire).toHaveBeenCalled();

    act(() => useSessionStore.setState({ ambienceEnabled: false }));
    rerender(<CampfireLoadingScreen />);

    expect(stopCampfire).toHaveBeenCalled();
  });

  it("does not relight the campfire after the screen has finished", () => {
    render(<CampfireLoadingScreen />);
    act(() => useSceneStore.setState({ loadProgress: 100 }));
    act(() => void vi.advanceTimersByTime(5000));

    expect(stopCampfire).toHaveBeenCalled();
    const startsBefore = startCampfire.mock.calls.length;
    act(() => void vi.advanceTimersByTime(5000));
    expect(startCampfire.mock.calls.length).toBe(startsBefore);
  });
});
