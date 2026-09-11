import { describe, it, expect, beforeEach } from "vitest";

import { useSessionStore } from "./sessionStore";

describe("useSessionStore", () => {
  beforeEach(() => {
    useSessionStore.setState({
      soundEnabled: true,
      ambienceEnabled: false,
      effectsEnabled: true,
      volume: 1,
      hasCompletedWelcome: false,
    });
  });

  it("initialises with default values", () => {
    const state = useSessionStore.getState();
    expect(state.soundEnabled).toBe(true);
    expect(state.ambienceEnabled).toBe(false);
    expect(state.effectsEnabled).toBe(true);
    expect(state.volume).toBe(1);
    expect(state.hasCompletedWelcome).toBe(false);
  });

  it("defaults ambience off in a fresh store, so rain never plays unasked", () => {
    expect(useSessionStore.getInitialState().ambienceEnabled).toBe(false);
  });

  it("toggles sound on/off", () => {
    useSessionStore.getState().setSoundEnabled(false);
    expect(useSessionStore.getState().soundEnabled).toBe(false);

    useSessionStore.getState().setSoundEnabled(true);
    expect(useSessionStore.getState().soundEnabled).toBe(true);
  });

  it("toggles ambience independently of the one-shot sounds", () => {
    useSessionStore.getState().setAmbienceEnabled(true);
    expect(useSessionStore.getState().ambienceEnabled).toBe(true);
    expect(useSessionStore.getState().soundEnabled).toBe(true);

    useSessionStore.getState().setSoundEnabled(false);
    expect(useSessionStore.getState().ambienceEnabled).toBe(true);
  });

  describe("the master level", () => {
    it("starts at full, so nothing about the scene is quieter than it was drawn", () => {
      expect(useSessionStore.getInitialState().volume).toBe(1);
    });

    it("takes a level anywhere in its range, silence included", () => {
      useSessionStore.getState().setVolume(0.35);
      expect(useSessionStore.getState().volume).toBe(0.35);

      useSessionStore.getState().setVolume(0);
      expect(useSessionStore.getState().volume).toBe(0);
    });

    /* A gain above 1 clips, and a negative one inverts the waveform. Clamped in
       the setter rather than in the controls, so no caller can pass either. */
    it("clamps a level from outside its range", () => {
      useSessionStore.getState().setVolume(4);
      expect(useSessionStore.getState().volume).toBe(1);

      useSessionStore.getState().setVolume(-1);
      expect(useSessionStore.getState().volume).toBe(0);
    });

    it("is independent of what is switched on to hear", () => {
      useSessionStore.getState().setVolume(0);
      expect(useSessionStore.getState().soundEnabled).toBe(true);
      expect(useSessionStore.getState().ambienceEnabled).toBe(false);
    });
  });

  it("toggles effects on/off", () => {
    useSessionStore.getState().setEffectsEnabled(false);
    expect(useSessionStore.getState().effectsEnabled).toBe(false);

    useSessionStore.getState().setEffectsEnabled(true);
    expect(useSessionStore.getState().effectsEnabled).toBe(true);
  });

  it("completes welcome", () => {
    useSessionStore.getState().completeWelcome();
    expect(useSessionStore.getState().hasCompletedWelcome).toBe(true);
  });

  it("resets welcome", () => {
    useSessionStore.getState().completeWelcome();
    expect(useSessionStore.getState().hasCompletedWelcome).toBe(true);

    useSessionStore.getState().resetWelcome();
    expect(useSessionStore.getState().hasCompletedWelcome).toBe(false);
  });
});
