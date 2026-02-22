import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let startRain: typeof import('./rainSynth').startRain;
let stopRain: typeof import('./rainSynth').stopRain;
let setRainVolume: typeof import('./rainSynth').setRainVolume;
let isRainPlaying: typeof import('./rainSynth').isRainPlaying;

describe('rainSynth', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const mod = await import('./rainSynth');
    startRain = mod.startRain;
    stopRain = mod.stopRain;
    setRainVolume = mod.setRainVolume;
    isRainPlaying = mod.isRainPlaying;
  });

  afterEach(() => {
    // Clean up: stop rain if playing
    if (isRainPlaying()) {
      stopRain(0);
      vi.advanceTimersByTime(500);
    }
    vi.useRealTimers();
  });

  it('is not playing initially', () => {
    expect(isRainPlaying()).toBe(false);
  });

  it('starts rain without throwing', () => {
    expect(() => startRain(0.15)).not.toThrow();
    expect(isRainPlaying()).toBe(true);
  });

  it('does not start twice if already playing', () => {
    startRain(0.15);
    expect(isRainPlaying()).toBe(true);

    // Calling again should be a no-op
    startRain(0.2);
    expect(isRainPlaying()).toBe(true);
  });

  it('stops rain after fade-out', () => {
    startRain(0.15);
    expect(isRainPlaying()).toBe(true);

    stopRain(0);
    // Need to advance past fadeTime * 1000 + 200
    vi.advanceTimersByTime(500);
    expect(isRainPlaying()).toBe(false);
  });

  it('setRainVolume does nothing when not playing', () => {
    expect(() => setRainVolume(0.5)).not.toThrow();
  });

  it('setRainVolume does not throw when playing', () => {
    startRain(0.15);
    expect(() => setRainVolume(0.3, 0.5)).not.toThrow();
  });
});
