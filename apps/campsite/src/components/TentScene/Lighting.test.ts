import { describe, it, expect } from "vitest";

import { lerpKeyframes } from "../../store/timeStore";

/**
 * These stops replicate the keyframe arrays in Lighting.tsx, so they check the
 * shape of the day cycle rather than the component — a drift between the two
 * goes unnoticed. See TODO.md.
 */

const AMBIENT_INT = [
  { t: 0.0, value: 0.35 },
  { t: 0.1, value: 0.8 },
  { t: 0.25, value: 1.0 },
  { t: 0.42, value: 0.8 },
  { t: 0.5, value: 0.5 },
  { t: 0.58, value: 0.55 },
  { t: 0.75, value: 0.55 },
  { t: 1.0, value: 0.35 },
];

const MAIN_INT = [
  { t: 0.0, value: 2.5 },
  { t: 0.15, value: 2.0 },
  { t: 0.25, value: 1.5 },
  { t: 0.42, value: 2.5 },
  { t: 0.5, value: 3.5 },
  { t: 0.58, value: 4.5 },
  { t: 0.75, value: 4.5 },
  { t: 1.0, value: 2.5 },
];

describe("Lighting keyframe configuration", () => {
  it("ambient intensity is brightest at noon", () => {
    const noon = lerpKeyframes(AMBIENT_INT, 0.25);
    const dawn = lerpKeyframes(AMBIENT_INT, 0.0);
    const night = lerpKeyframes(AMBIENT_INT, 0.75);

    expect(noon).toBeGreaterThan(dawn);
    expect(noon).toBeGreaterThan(night);
  });

  it("main light is warmest/brightest at night (lantern effect)", () => {
    const night = lerpKeyframes(MAIN_INT, 0.75);
    const noon = lerpKeyframes(MAIN_INT, 0.25);

    expect(night).toBeGreaterThan(noon);
  });

  it("all keyframe values are positive", () => {
    for (let p = 0; p <= 1; p += 0.05) {
      expect(lerpKeyframes(AMBIENT_INT, p)).toBeGreaterThanOrEqual(0);
      expect(lerpKeyframes(MAIN_INT, p)).toBeGreaterThanOrEqual(0);
    }
  });

  it("ambient intensity is continuous (no large jumps)", () => {
    let prev = lerpKeyframes(AMBIENT_INT, 0);
    for (let p = 0.01; p <= 1; p += 0.01) {
      const current = lerpKeyframes(AMBIENT_INT, p);
      const delta = Math.abs(current - prev);
      expect(delta).toBeLessThan(0.15); // no jump > 0.15 per 1% of day
      prev = current;
    }
  });
});
