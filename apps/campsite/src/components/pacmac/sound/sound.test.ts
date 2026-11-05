import { beforeEach, describe, expect, it, vi } from "vitest";

let sound: typeof import("./sound");
let store: typeof import("../../../store/sessionStore").useSessionStore;
let ctx: AudioContext;

describe("the game's sound", () => {
  beforeEach(async () => {
    vi.resetModules();
    ctx = new AudioContext();
    vi.doMock("../../../audio/audioContext", () => ({ getAudioContext: () => ctx }));
    vi.doMock("../../../audio/masterVolume", () => ({
      getMasterBus: () => ({ connect: vi.fn(), gain: { value: 1 } }),
    }));
    store = (await import("../../../store/sessionStore")).useSessionStore;
    store.setState({ soundEnabled: true });
    sound = await import("./sound");
    sound.resetSound();
  });

  it("makes no sound at all while the site is muted", () => {
    store.setState({ soundEnabled: false });
    sound.play({ kind: "bite", syllable: "mac" });
    sound.play({ kind: "start" });
    sound.setSiren(0.5);
    expect(ctx.createOscillator).not.toHaveBeenCalled();
    expect(ctx.createGain).not.toHaveBeenCalled();
  });

  it("synthesises the bite while there is no recording", () => {
    sound.play({ kind: "bite", syllable: "mac" });
    expect(ctx.createOscillator).toHaveBeenCalled();
    expect(ctx.createBufferSource).not.toHaveBeenCalled();
  });

  it("plays half the recording per bite once it has loaded", async () => {
    const buffer = { duration: 0.4 } as AudioBuffer;
    vi.mocked(ctx.decodeAudioData).mockResolvedValue(buffer);
    const fetchClip = vi
      .fn()
      .mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
    await sound.loadClip(fetchClip);
    expect(fetchClip).toHaveBeenCalledWith(sound.MACKA_CLIP);

    sound.play({ kind: "bite", syllable: "ka" });
    const source = vi.mocked(ctx.createBufferSource).mock.results[0].value;
    expect(source.buffer).toBe(buffer);
    expect(source.start).toHaveBeenCalledWith(ctx.currentTime, 0.2, 0.2);
    expect(ctx.createOscillator).not.toHaveBeenCalled();
  });

  it("keeps the synthesised bite when the recording is missing", async () => {
    vi.mocked(ctx.decodeAudioData).mockRejectedValue(new Error("not audio"));
    await sound.loadClip(
      vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }),
    );
    sound.play({ kind: "bite", syllable: "mac" });
    expect(ctx.createBufferSource).not.toHaveBeenCalled();
    expect(ctx.createOscillator).toHaveBeenCalled();
  });

  it("starts the siren once and stops it on null", () => {
    sound.setSiren(0);
    const oscillators = vi.mocked(ctx.createOscillator).mock.calls.length;
    expect(oscillators).toBeGreaterThan(0);
    sound.setSiren(null);
    const [tone] = vi.mocked(ctx.createOscillator).mock.results.map((r) => r.value);
    expect(tone.stop).toHaveBeenCalled();
  });
});
