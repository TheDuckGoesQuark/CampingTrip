import * as THREE from "three";
import { describe, it, expect } from "vitest";

import { lerpColorKeyframes } from "./colorKeyframes";

describe("lerpColorKeyframes", () => {
  const stops = [
    { t: 0, color: new THREE.Color(0x000000) }, // black
    { t: 0.5, color: new THREE.Color(0xff0000) }, // red
    { t: 1, color: new THREE.Color(0xffffff) }, // white
  ];

  it("returns first color clone when t <= first stop", () => {
    const result = lerpColorKeyframes(stops, -1);
    expect(result.equals(new THREE.Color(0x000000))).toBe(true);
    // Should be a clone, not the same reference
    expect(result).not.toBe(stops[0].color);
  });

  it("returns last color clone when t >= last stop", () => {
    const result = lerpColorKeyframes(stops, 2);
    expect(result.equals(new THREE.Color(0xffffff))).toBe(true);
    expect(result).not.toBe(stops[2].color);
  });

  it("interpolates between color stops", () => {
    const mid = lerpColorKeyframes(stops, 0.25);
    // Between black and red with smoothstep
    expect(mid.r).toBeGreaterThan(0);
    expect(mid.r).toBeLessThanOrEqual(1);
  });

  it("does not mutate original color stops", () => {
    const originalRed = stops[1].color.clone();
    lerpColorKeyframes(stops, 0.75);
    expect(stops[1].color.equals(originalRed)).toBe(true);
  });
});
