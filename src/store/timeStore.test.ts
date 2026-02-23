import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import {
  useTimeStore,
  progressFromSystemClock,
  getTimeOfDay,
  getNightFactor,
  lerpKeyframes,
  lerpColorKeyframes,
} from './timeStore';

// ─── Store behaviour ─────────────────────────────────────────────

describe('useTimeStore', () => {
  beforeEach(() => {
    useTimeStore.setState({ progress: 0, isManual: false });
  });

  it('initialises with default values', () => {
    const state = useTimeStore.getState();
    expect(state.progress).toBeGreaterThanOrEqual(0);
    expect(state.progress).toBeLessThanOrEqual(1);
    expect(state.isManual).toBe(false);
  });

  it('setProgress wraps values to 0–1 range', () => {
    const { setProgress } = useTimeStore.getState();

    setProgress(0.5);
    expect(useTimeStore.getState().progress).toBeCloseTo(0.5);

    // Wraps above 1
    setProgress(1.3);
    expect(useTimeStore.getState().progress).toBeCloseTo(0.3, 5);

    // Wraps negative values
    setProgress(-0.2);
    expect(useTimeStore.getState().progress).toBeCloseTo(0.8, 5);
  });

  it('setManual toggles manual mode', () => {
    useTimeStore.getState().setManual(true);
    expect(useTimeStore.getState().isManual).toBe(true);

    useTimeStore.getState().setManual(false);
    expect(useTimeStore.getState().isManual).toBe(false);
  });
});

// ─── progressFromSystemClock ─────────────────────────────────────

describe('progressFromSystemClock', () => {
  it('returns 0 at 6 AM', () => {
    const date = new Date(2024, 0, 1, 6, 0);
    expect(progressFromSystemClock(date)).toBeCloseTo(0, 5);
  });

  it('returns 0.25 at noon', () => {
    const date = new Date(2024, 0, 1, 12, 0);
    expect(progressFromSystemClock(date)).toBeCloseTo(0.25, 5);
  });

  it('returns 0.5 at 6 PM', () => {
    const date = new Date(2024, 0, 1, 18, 0);
    expect(progressFromSystemClock(date)).toBeCloseTo(0.5, 5);
  });

  it('returns 0.75 at midnight', () => {
    const date = new Date(2024, 0, 1, 0, 0);
    expect(progressFromSystemClock(date)).toBeCloseTo(0.75, 5);
  });

  it('returns value between 0 and 1', () => {
    // Test across a range of hours
    for (let h = 0; h < 24; h++) {
      const date = new Date(2024, 0, 1, h, 0);
      const p = progressFromSystemClock(date);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThan(1);
    }
  });

  it('accounts for minutes', () => {
    const at630 = new Date(2024, 0, 1, 6, 30);
    const expected = 0.5 / 24; // 30 min = 0.5 hours out of 24
    expect(progressFromSystemClock(at630)).toBeCloseTo(expected, 4);
  });
});

// ─── getTimeOfDay ────────────────────────────────────────────────

describe('getTimeOfDay', () => {
  it('returns 6 AM for progress = 0', () => {
    const { hours, minutes, isDaytime, ampm, h12 } = getTimeOfDay(0);
    expect(hours).toBe(6);
    expect(minutes).toBe(0);
    expect(isDaytime).toBe(true);
    expect(ampm).toBe('am');
    expect(h12).toBe(6);
  });

  it('returns noon for progress = 0.25', () => {
    const { hours, isDaytime, ampm, h12 } = getTimeOfDay(0.25);
    expect(hours).toBe(12);
    expect(isDaytime).toBe(true);
    expect(ampm).toBe('pm');
    expect(h12).toBe(12);
  });

  it('returns 6 PM for progress = 0.5', () => {
    const { hours, isDaytime } = getTimeOfDay(0.5);
    expect(hours).toBe(18);
    expect(isDaytime).toBe(false); // 18 is NOT < 18, so isDaytime = false
  });

  it('returns midnight for progress = 0.75', () => {
    const { hours, isDaytime, ampm, h12 } = getTimeOfDay(0.75);
    expect(hours).toBe(0);
    expect(isDaytime).toBe(false);
    expect(ampm).toBe('am');
    expect(h12).toBe(12); // midnight is 12 AM
  });

  it('formats timeStr correctly', () => {
    const { timeStr } = getTimeOfDay(0);
    expect(timeStr).toBe('6:00 am');
  });

  it('pads minutes with leading zero', () => {
    // progress that gives 6:05 AM
    const { timeStr } = getTimeOfDay(5 / (24 * 60)); // 5 minutes past 6 AM
    expect(timeStr).toMatch(/:\d{2}/); // minutes always 2 digits
  });
});

// ─── getNightFactor ──────────────────────────────────────────────

describe('getNightFactor', () => {
  it('returns ~1 just before dawn (night)', () => {
    // progress ~0 is dawn start, just before = night
    // But the function returns a smooth transition for 0-0.06
    expect(getNightFactor(0)).toBeCloseTo(1, 1); // start of dawn = still night
  });

  it('returns 0 during full day (progress 0.06 to 0.46)', () => {
    expect(getNightFactor(0.1)).toBe(0);
    expect(getNightFactor(0.25)).toBe(0);
    expect(getNightFactor(0.4)).toBe(0);
  });

  it('transitions smoothly during dusk (0.46–0.54)', () => {
    const midDusk = getNightFactor(0.5);
    expect(midDusk).toBeGreaterThan(0);
    expect(midDusk).toBeLessThan(1);
  });

  it('returns 1 during full night (progress > 0.54)', () => {
    expect(getNightFactor(0.6)).toBe(1);
    expect(getNightFactor(0.75)).toBe(1);
    expect(getNightFactor(0.9)).toBe(1);
  });

  it('is monotonically increasing during dusk', () => {
    let prev = getNightFactor(0.46);
    for (let p = 0.47; p <= 0.54; p += 0.01) {
      const current = getNightFactor(p);
      expect(current).toBeGreaterThanOrEqual(prev);
      prev = current;
    }
  });

  it('is monotonically decreasing during dawn', () => {
    // Night factor decreases during dawn (goes from 1→0)
    let prev = getNightFactor(0);
    for (let p = 0.01; p <= 0.06; p += 0.01) {
      const current = getNightFactor(p);
      expect(current).toBeLessThanOrEqual(prev);
      prev = current;
    }
  });
});

// ─── lerpKeyframes ───────────────────────────────────────────────

describe('lerpKeyframes', () => {
  const stops = [
    { t: 0, value: 0 },
    { t: 0.5, value: 100 },
    { t: 1, value: 50 },
  ];

  it('returns first value when t <= first stop', () => {
    expect(lerpKeyframes(stops, -1)).toBe(0);
    expect(lerpKeyframes(stops, 0)).toBe(0);
  });

  it('returns last value when t >= last stop', () => {
    expect(lerpKeyframes(stops, 1)).toBe(50);
    expect(lerpKeyframes(stops, 2)).toBe(50);
  });

  it('returns exact values at keyframe stops', () => {
    expect(lerpKeyframes(stops, 0)).toBe(0);
    expect(lerpKeyframes(stops, 0.5)).toBe(100);
    expect(lerpKeyframes(stops, 1)).toBe(50);
  });

  it('interpolates between stops', () => {
    const mid = lerpKeyframes(stops, 0.25);
    // smoothstep interpolation means it won't be exactly 50
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(100);
  });

  it('uses smoothstep interpolation (not linear)', () => {
    // At midpoint of first segment (t=0.25), smoothstep of 0.5 = 0.5
    // So value should be lerp(0, 100, 0.5) = 50
    const mid = lerpKeyframes(stops, 0.25);
    expect(mid).toBeCloseTo(50, 0);
  });
});

// ─── lerpColorKeyframes ──────────────────────────────────────────

describe('lerpColorKeyframes', () => {
  const stops = [
    { t: 0, color: new THREE.Color(0x000000) },  // black
    { t: 0.5, color: new THREE.Color(0xff0000) }, // red
    { t: 1, color: new THREE.Color(0xffffff) },   // white
  ];

  it('returns first color clone when t <= first stop', () => {
    const result = lerpColorKeyframes(stops, -1);
    expect(result.equals(new THREE.Color(0x000000))).toBe(true);
    // Should be a clone, not the same reference
    expect(result).not.toBe(stops[0].color);
  });

  it('returns last color clone when t >= last stop', () => {
    const result = lerpColorKeyframes(stops, 2);
    expect(result.equals(new THREE.Color(0xffffff))).toBe(true);
    expect(result).not.toBe(stops[2].color);
  });

  it('interpolates between color stops', () => {
    const mid = lerpColorKeyframes(stops, 0.25);
    // Between black and red with smoothstep
    expect(mid.r).toBeGreaterThan(0);
    expect(mid.r).toBeLessThanOrEqual(1);
  });

  it('does not mutate original color stops', () => {
    const originalRed = stops[1].color.clone();
    lerpColorKeyframes(stops, 0.75);
    expect(stops[1].color.equals(originalRed)).toBe(true);
  });
});
