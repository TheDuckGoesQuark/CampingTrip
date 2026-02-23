import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let startRain: typeof import('./rainSynth').startRain;
let stopRain: typeof import('./rainSynth').stopRain;
let setRainVolume: typeof import('./rainSynth').setRainVolume;
let isRainPlaying: typeof import('./rainSynth').isRainPlaying;

let mockCtx: AudioContext;

describe('rainSynth', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();

    mockCtx = new AudioContext();
    vi.doMock('./audioContext', () => ({
      getAudioContext: () => mockCtx,
    }));

    const mod = await import('./rainSynth');
    startRain = mod.startRain;
    stopRain = mod.stopRain;
    setRainVolume = mod.setRainVolume;
    isRainPlaying = mod.isRainPlaying;
  });

  afterEach(() => {
    if (isRainPlaying()) {
      stopRain(0);
      vi.advanceTimersByTime(500);
    }
    vi.useRealTimers();
  });

  it('is not playing initially', () => {
    expect(isRainPlaying()).toBe(false);
  });

  it('creates noise layers with filters and gain nodes on start', () => {
    startRain(0.15);
    expect(isRainPlaying()).toBe(true);
    // 3 looped noise layers + at least 1 drip burst source
    const bufferSourceCalls = (mockCtx.createBufferSource as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(bufferSourceCalls).toBeGreaterThanOrEqual(3);
    // Deep (lowpass) + mid (bandpass) + high (bandpass) + drip (lowpass) filters
    const filterCalls = (mockCtx.createBiquadFilter as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(filterCalls).toBeGreaterThanOrEqual(3);
    // Master gain + 3 layer gains + drip envelope
    const gainCalls = (mockCtx.createGain as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(gainCalls).toBeGreaterThanOrEqual(4);
  });

  it('creates noise buffers (brownian + white) for realistic rain texture', () => {
    startRain(0.15);
    // createBuffer for deep noise (brownian, 6s), mid noise (white, 4s),
    // high noise (white, 3s), and at least one drip burst
    const bufferCalls = (mockCtx.createBuffer as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(bufferCalls).toBeGreaterThanOrEqual(3);
  });

  it('does not start twice if already playing', () => {
    startRain(0.15);
    const callsAfterFirst = (mockCtx.createBufferSource as ReturnType<typeof vi.fn>).mock.calls.length;
    startRain(0.2);
    // No new sources should be created on second call
    expect((mockCtx.createBufferSource as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsAfterFirst);
    expect(isRainPlaying()).toBe(true);
  });

  it('stops rain and cleans up sources after fade-out', () => {
    startRain(0.15);
    expect(isRainPlaying()).toBe(true);

    stopRain(0);
    // Advance past fadeTime * 1000 + 200ms cleanup delay
    vi.advanceTimersByTime(500);
    expect(isRainPlaying()).toBe(false);
  });

  it('setRainVolume is a no-op when not playing', () => {
    setRainVolume(0.5);
    expect(isRainPlaying()).toBe(false);
  });

  it('setRainVolume keeps rain playing after volume change', () => {
    startRain(0.15);
    setRainVolume(0.3, 0.5);
    expect(isRainPlaying()).toBe(true);
  });
});
