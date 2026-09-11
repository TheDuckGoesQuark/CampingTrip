import { describe, it, expect, vi, beforeEach } from "vitest";

let masterVolume: typeof import("./masterVolume");
let sessionStore: typeof import("../store/sessionStore").useSessionStore;
let mockCtx: AudioContext;

describe("masterVolume", () => {
  beforeEach(async () => {
    vi.resetModules();
    mockCtx = new AudioContext();
    vi.doMock("./audioContext", () => ({ getAudioContext: () => mockCtx }));

    const storeMod = await import("../store/sessionStore");
    sessionStore = storeMod.useSessionStore;
    sessionStore.setState({ volume: 1 });

    masterVolume = await import("./masterVolume");
  });

  it("reads the level off the store", () => {
    sessionStore.setState({ volume: 0.25 });
    expect(masterVolume.masterVolume()).toBe(0.25);
  });

  describe("the bus", () => {
    it("opens at the stored level, into the context's destination", () => {
      sessionStore.setState({ volume: 0.5 });
      const bus = masterVolume.getMasterBus();
      expect(bus.gain.value).toBe(0.5);
      expect(bus.connect).toHaveBeenCalledWith(mockCtx.destination);
    });

    it("is built once and handed back", () => {
      expect(masterVolume.getMasterBus()).toBe(masterVolume.getMasterBus());
      expect(mockCtx.createGain).toHaveBeenCalledOnce();
    });

    it("ramps to a moved level rather than stepping to it", () => {
      const bus = masterVolume.getMasterBus();
      sessionStore.setState({ volume: 0.4 });
      expect(bus.gain.cancelScheduledValues).toHaveBeenCalledWith(mockCtx.currentTime);
      expect(bus.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        0.4,
        mockCtx.currentTime + 0.02,
      );
    });

    it("leaves the gain alone when unrelated session state changes", () => {
      const bus = masterVolume.getMasterBus();
      sessionStore.getState().editText("readme", "hello");
      sessionStore.getState().setSoundEnabled(false);
      expect(bus.gain.linearRampToValueAtTime).not.toHaveBeenCalled();
    });
  });

  describe("onMasterVolumeChange", () => {
    it("reports a moved level", () => {
      const listener = vi.fn();
      masterVolume.onMasterVolumeChange(listener);
      sessionStore.getState().setVolume(0.3);
      expect(listener).toHaveBeenCalledWith(0.3);
    });

    it("stays quiet when the level is set to what it already is", () => {
      const listener = vi.fn();
      masterVolume.onMasterVolumeChange(listener);
      sessionStore.getState().setVolume(1);
      expect(listener).not.toHaveBeenCalled();
    });

    it("stops reporting once unsubscribed", () => {
      const listener = vi.fn();
      masterVolume.onMasterVolumeChange(listener)();
      sessionStore.getState().setVolume(0.2);
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
