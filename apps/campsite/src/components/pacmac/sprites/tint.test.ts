import { describe, expect, it } from "vitest";

import { FRIGHTENED_BLUE, tintPixels } from "./tint";

describe("tintPixels", () => {
  it("keeps a red ghost's shape in blue rather than turning it black", () => {
    const red = new Uint8ClampedArray([255, 0, 0, 255]);
    tintPixels(red, FRIGHTENED_BLUE);
    expect(red[2]).toBeGreaterThan(100);
    expect(red[2]).toBeGreaterThan(red[0]);
  });

  it("shades brighter pixels brighter", () => {
    const pixels = new Uint8ClampedArray([40, 40, 40, 255, 240, 240, 240, 255]);
    tintPixels(pixels, FRIGHTENED_BLUE);
    expect(pixels[6]).toBeGreaterThan(pixels[2]);
  });

  it("leaves transparency alone", () => {
    const pixels = new Uint8ClampedArray([255, 255, 255, 0]);
    tintPixels(pixels, FRIGHTENED_BLUE);
    expect(pixels[3]).toBe(0);
  });
});
