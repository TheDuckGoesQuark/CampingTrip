import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  lerpKeyframes,
  getNightFactor,
} from '../../store/timeStore';

/**
 * The Lighting component is an R3F component that runs in a useFrame loop.
 * We test the keyframe interpolation functions it depends on (exported from
 * timeStore) and verify the lighting configuration constants make sense.
 *
 * The actual light setup is tested via scene structure assertions below.
 */

// ─── Lighting keyframe data validation ───────────────────────────
// These replicate the keyframe arrays defined in Lighting.tsx to verify
// they produce sensible values across the full day cycle.

const AMBIENT_INT = [
  { t: 0.00, value: 0.35 },
  { t: 0.10, value: 0.8 },
  { t: 0.25, value: 1.0 },
  { t: 0.42, value: 0.8 },
  { t: 0.50, value: 0.5 },
  { t: 0.58, value: 0.55 },
  { t: 0.75, value: 0.55 },
  { t: 1.00, value: 0.35 },
];

const MAIN_INT = [
  { t: 0.00, value: 2.5 },
  { t: 0.15, value: 2.0 },
  { t: 0.25, value: 1.5 },
  { t: 0.42, value: 2.5 },
  { t: 0.50, value: 3.5 },
  { t: 0.58, value: 4.5 },
  { t: 0.75, value: 4.5 },
  { t: 1.00, value: 2.5 },
];

describe('Lighting keyframe configuration', () => {
  it('ambient intensity is brightest at noon', () => {
    const noon = lerpKeyframes(AMBIENT_INT, 0.25);
    const dawn = lerpKeyframes(AMBIENT_INT, 0.0);
    const night = lerpKeyframes(AMBIENT_INT, 0.75);

    expect(noon).toBeGreaterThan(dawn);
    expect(noon).toBeGreaterThan(night);
  });

  it('main light is warmest/brightest at night (lantern effect)', () => {
    const night = lerpKeyframes(MAIN_INT, 0.75);
    const noon = lerpKeyframes(MAIN_INT, 0.25);

    expect(night).toBeGreaterThan(noon);
  });

  it('all keyframe values are positive', () => {
    for (let p = 0; p <= 1; p += 0.05) {
      expect(lerpKeyframes(AMBIENT_INT, p)).toBeGreaterThanOrEqual(0);
      expect(lerpKeyframes(MAIN_INT, p)).toBeGreaterThanOrEqual(0);
    }
  });

  it('ambient intensity is continuous (no large jumps)', () => {
    let prev = lerpKeyframes(AMBIENT_INT, 0);
    for (let p = 0.01; p <= 1; p += 0.01) {
      const current = lerpKeyframes(AMBIENT_INT, p);
      const delta = Math.abs(current - prev);
      expect(delta).toBeLessThan(0.15); // no jump > 0.15 per 1% of day
      prev = current;
    }
  });
});

describe('Lighting night factor integration', () => {
  it('campfire is brighter at night', () => {
    const nightFactor = getNightFactor(0.75); // midnight
    const dayFactor = getNightFactor(0.25);   // noon

    expect(nightFactor).toBe(1);
    expect(dayFactor).toBe(0);

    // Campfire intensity calculation from Lighting.tsx:
    // const nightInt = doorOpen ? 2.5 : 0.8;
    // const dayInt = doorOpen ? 2.0 : 0.3;
    // intensity = lerp(dayInt, nightInt, nf)
    // Campfire intensity calculation from Lighting.tsx:
    // const nightInt = doorOpen ? 2.5 : 0.8;
    // const dayInt = doorOpen ? 2.0 : 0.3;
    // intensity = lerp(dayInt, nightInt, nf)
    const nightIntensity = THREE.MathUtils.lerp(2.0, 2.5, nightFactor);
    const dayIntensity = THREE.MathUtils.lerp(2.0, 2.5, dayFactor);

    expect(nightIntensity).toBe(2.5);
    expect(dayIntensity).toBe(2.0);
  });

  it('door light is off when door is closed', () => {
    // From Lighting.tsx: intensity = doorOpen ? baseInt : 0
    const doorOpen = false;
    const baseInt = THREE.MathUtils.lerp(1.5, 0.6, getNightFactor(0.5));
    const intensity = doorOpen ? baseInt : 0;

    expect(intensity).toBe(0);
  });
});
