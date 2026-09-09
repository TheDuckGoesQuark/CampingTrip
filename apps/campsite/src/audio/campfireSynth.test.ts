import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

let mockCtx: AudioContext & { state: AudioContextState };
let fire: typeof import("./campfireSynth");

describe("campfireSynth", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();

    mockCtx = new AudioContext() as AudioContext & { state: AudioContextState };
    vi.doMock("./audioContext", () => ({ getAudioContext: () => mockCtx }));

    fire = await import("./campfireSynth");
  });

  afterEach(() => {
    fire.stopCampfire(0);
    vi.advanceTimersByTime(500);
    vi.useRealTimers();
  });

  it("is not playing until lit", () => {
    expect(fire.isCampfirePlaying()).toBe(false);
  });

  it("builds a looping base layer and crackles when lit", () => {
    fire.startCampfire(0.15);

    expect(fire.isCampfirePlaying()).toBe(true);
    const sources = (mockCtx.createBufferSource as ReturnType<typeof vi.fn>).mock.results;
    expect(sources.length).toBeGreaterThanOrEqual(2); // base + at least one crackle
    expect(sources[0].value.loop).toBe(true);
  });

  // Web Audio is mute before a gesture, so claiming success would leave the
  // caller with no reason to retry and the visitor with a silent fire.
  it("declines to light while the context is not running", () => {
    mockCtx.state = "suspended";
    fire.startCampfire(0.15);

    expect(fire.isCampfirePlaying()).toBe(false);
    expect(mockCtx.createBufferSource).not.toHaveBeenCalled();
  });

  it("lights on a later attempt once the context is running", () => {
    mockCtx.state = "suspended";
    fire.startCampfire(0.15);
    expect(fire.isCampfirePlaying()).toBe(false);

    mockCtx.state = "running";
    fire.startCampfire(0.15);
    expect(fire.isCampfirePlaying()).toBe(true);
  });

  it("does not build a second fire when already lit", () => {
    fire.startCampfire(0.15);
    const after = (mockCtx.createGain as ReturnType<typeof vi.fn>).mock.calls.length;
    fire.startCampfire(0.15);
    expect((mockCtx.createGain as ReturnType<typeof vi.fn>).mock.calls.length).toBe(after);
  });

  it("reports itself out the moment it is stopped, not when the fade ends", () => {
    fire.startCampfire(0.15);
    fire.stopCampfire(1.5);
    expect(fire.isCampfirePlaying()).toBe(false);
  });

  // Relighting mid-fade must build a fresh graph, not hand back one the
  // teardown timer is about to tear down.
  it("builds a fresh fire when relit during a fade-out", () => {
    fire.startCampfire(0.15);
    fire.stopCampfire(1.5);
    fire.startCampfire(0.15);
    expect(fire.isCampfirePlaying()).toBe(true);

    vi.advanceTimersByTime(3000);
    expect(fire.isCampfirePlaying()).toBe(true);
  });

  it("stops scheduling crackles once out", () => {
    fire.startCampfire(0.15);
    fire.stopCampfire(0);
    vi.advanceTimersByTime(400);
    const after = (mockCtx.createBufferSource as ReturnType<typeof vi.fn>).mock.calls.length;
    vi.advanceTimersByTime(2000);
    expect((mockCtx.createBufferSource as ReturnType<typeof vi.fn>).mock.calls.length).toBe(after);
  });

  it("stopCampfire is a no-op when nothing is lit", () => {
    expect(() => fire.stopCampfire()).not.toThrow();
    expect(mockCtx.createGain).not.toHaveBeenCalled();
  });
});
