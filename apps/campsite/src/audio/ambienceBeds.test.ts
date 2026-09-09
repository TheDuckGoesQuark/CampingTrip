import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

interface MockHowl {
  opts: Record<string, unknown>;
  play: ReturnType<typeof vi.fn>;
  fade: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  unload: ReturnType<typeof vi.fn>;
  volume: ReturnType<typeof vi.fn>;
}

let howls: MockHowl[] = [];

vi.mock("howler", () => ({
  Howl: vi.fn(function (this: MockHowl, opts: Record<string, unknown>) {
    let vol = opts.volume as number;
    this.opts = opts;
    this.play = vi.fn();
    this.stop = vi.fn();
    this.unload = vi.fn();
    this.volume = vi.fn(() => vol);
    this.fade = vi.fn((_from: number, to: number) => {
      vol = to;
    });
    howls.push(this);
  }),
}));

let beds: typeof import("./ambienceBeds");

describe("ambienceBeds", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    howls = [];
    beds = await import("./ambienceBeds");
  });

  afterEach(() => {
    beds.stopAmbience(0);
    vi.advanceTimersByTime(500);
    vi.useRealTimers();
  });

  it("is not playing until started", () => {
    expect(beds.isAmbiencePlaying()).toBe(false);
  });

  it("starts both beds looping and silent", () => {
    beds.startAmbience();

    expect(beds.isAmbiencePlaying()).toBe(true);
    expect(howls).toHaveLength(2);
    for (const howl of howls) {
      expect(howl.opts.loop).toBe(true);
      expect(howl.opts.volume).toBe(0);
      expect(howl.play).toHaveBeenCalled();
    }
  });

  // The HTML5 Audio path gaps at the loop point and resists gain automation.
  it("keeps both beds on the Web Audio path", () => {
    beds.startAmbience();
    for (const howl of howls) expect(howl.opts.html5).toBe(false);
  });

  it("does not build a second set of beds when already started", () => {
    beds.startAmbience();
    beds.startAmbience();
    expect(howls).toHaveLength(2);
  });

  it("ramps each bed to its own target", () => {
    beds.startAmbience();
    beds.setAmbienceMix({ rain: 0.12, day: 0 }, 500);

    const [rain, day] = howls;
    expect(rain.fade).toHaveBeenCalledWith(0, 0.12, 500);
    expect(day.fade).not.toHaveBeenCalled(); // already at 0
  });

  it("ramps from the bed's current gain, not from zero", () => {
    beds.startAmbience();
    beds.setAmbienceMix({ rain: 0.12, day: 0 });
    beds.setAmbienceMix({ rain: 0.04, day: 0 });

    expect(howls[0].fade).toHaveBeenLastCalledWith(0.12, 0.04, expect.any(Number));
  });

  it("fades out, then releases both beds", () => {
    beds.startAmbience();
    beds.setAmbienceMix({ rain: 0.12, day: 0.1 });
    const [rain, day] = howls;

    beds.stopAmbience(100);
    expect(rain.fade).toHaveBeenLastCalledWith(0.12, 0, 100);
    expect(day.fade).toHaveBeenLastCalledWith(0.1, 0, 100);
    expect(beds.isAmbiencePlaying()).toBe(false);

    expect(rain.unload).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400);
    expect(rain.unload).toHaveBeenCalled();
    expect(day.unload).toHaveBeenCalled();
  });

  // Re-enabling mid-fade must not hand back beds the teardown timer will unload.
  it("builds fresh beds when restarted during a fade-out", () => {
    beds.startAmbience();
    beds.stopAmbience(100);
    beds.startAmbience();
    expect(howls).toHaveLength(4);

    vi.advanceTimersByTime(400);
    expect(howls[2].unload).not.toHaveBeenCalled();
    expect(beds.isAmbiencePlaying()).toBe(true);
  });

  it("setAmbienceMix is a no-op before the beds exist", () => {
    expect(() => beds.setAmbienceMix({ rain: 0.1, day: 0.1 })).not.toThrow();
    expect(howls).toHaveLength(0);
  });
});
