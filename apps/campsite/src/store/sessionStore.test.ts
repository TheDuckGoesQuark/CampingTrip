import { describe, it, expect, beforeEach } from "vitest";

import { useSessionStore } from "./sessionStore";

describe("useSessionStore", () => {
  beforeEach(() => {
    useSessionStore.setState({
      soundEnabled: true,
      ambienceEnabled: false,
      effectsEnabled: true,
      hasCompletedWelcome: false,
    });
  });

  it("initialises with default values", () => {
    const state = useSessionStore.getState();
    expect(state.soundEnabled).toBe(true);
    expect(state.ambienceEnabled).toBe(false);
    expect(state.effectsEnabled).toBe(true);
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
