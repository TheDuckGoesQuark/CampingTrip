import { describe, expect, it } from "vitest";

import {
  centre,
  clamp,
  FIXED_BELOW,
  isFixedLayer,
  KEEP_VISIBLE,
  MENU_BAR_HEIGHT,
  maximised,
  MIN_HEIGHT,
  MIN_WIDTH,
  movedBy,
  refit,
  resizedBy,
  sizeFor,
  type Box,
} from "./geometry";

const LAYER = { width: 1280, height: 800 };
const box = (over: Partial<Box> = {}): Box => ({
  x: 200,
  y: 100,
  width: 600,
  height: 400,
  ...over,
});

describe("sizeFor", () => {
  it("takes a proportion of the layer up to the hint's ceiling", () => {
    // 1280 * 0.92 is over the 880 ceiling, so lg caps; 800 * 0.78 is under 660.
    expect(sizeFor("lg", LAYER)).toEqual({ width: 880, height: 624 });
  });

  it("shrinks with a small layer rather than overflowing it", () => {
    const { width } = sizeFor("lg", { width: 500, height: 800 });
    expect(width).toBe(460);
  });

  it("never goes below the usable minimum, however small the layer", () => {
    expect(sizeFor("sm", { width: 100, height: 100 })).toEqual({
      width: MIN_WIDTH,
      height: MIN_HEIGHT,
    });
  });
});

describe("centre", () => {
  it("opens a window in the middle of its layer", () => {
    const opened = centre("lg", LAYER);
    expect(opened.x).toBe((1280 - 880) / 2);
    expect(opened.y).toBe((800 - 624) / 2);
  });
});

describe("maximised", () => {
  it("fills the layer but leaves the menu bar showing", () => {
    expect(maximised(LAYER)).toEqual({
      x: 0,
      y: MENU_BAR_HEIGHT,
      width: 1280,
      height: 800 - MENU_BAR_HEIGHT,
    });
  });
});

describe("clamp", () => {
  it("leaves a window that is already inside alone", () => {
    expect(clamp(box(), LAYER)).toEqual(box());
  });

  it("never lets a window rise above the menu bar", () => {
    expect(clamp(box({ y: -400 }), LAYER).y).toBe(MENU_BAR_HEIGHT);
  });

  it("keeps a grabbable strip on screen at both edges", () => {
    expect(clamp(box({ x: -5000 }), LAYER).x).toBe(KEEP_VISIBLE - 600);
    expect(clamp(box({ x: 5000 }), LAYER).x).toBe(LAYER.width - KEEP_VISIBLE);
    expect(clamp(box({ y: 5000 }), LAYER).y).toBe(LAYER.height - KEEP_VISIBLE);
  });
});

describe("movedBy", () => {
  it("shifts by the pointer delta", () => {
    expect(movedBy(box(), 40, -25, LAYER)).toMatchObject({ x: 240, y: 75 });
  });

  it("cannot be dragged out of reach", () => {
    expect(movedBy(box(), 0, -10_000, LAYER).y).toBe(MENU_BAR_HEIGHT);
  });

  it("leaves the size untouched", () => {
    const moved = movedBy(box(), 40, 40, LAYER);
    expect(moved.width).toBe(600);
    expect(moved.height).toBe(400);
  });
});

describe("resizedBy", () => {
  it("grows from the bottom-right without moving the frame", () => {
    const grown = resizedBy(box(), 100, 50, LAYER);
    expect(grown).toEqual({ x: 200, y: 100, width: 700, height: 450 });
  });

  it("stops at the usable minimum rather than inverting", () => {
    expect(resizedBy(box(), -10_000, -10_000, LAYER)).toMatchObject({
      width: MIN_WIDTH,
      height: MIN_HEIGHT,
    });
  });

  it("stops at the layer's edge", () => {
    const grown = resizedBy(box(), 10_000, 10_000, LAYER);
    expect(grown.width).toBe(LAYER.width - 200);
    expect(grown.height).toBe(LAYER.height - 100);
  });
});

describe("refit", () => {
  it("pulls an oversized window back inside a shrunken layer", () => {
    const small = { width: 400, height: 300 };
    const fitted = refit(box(), small);
    expect(fitted.width).toBeLessThanOrEqual(small.width);
    expect(fitted.height).toBeLessThanOrEqual(small.height - MENU_BAR_HEIGHT);
    expect(fitted.y).toBeGreaterThanOrEqual(MENU_BAR_HEIGHT);
  });

  it("leaves a window that still fits alone", () => {
    expect(refit(box(), LAYER)).toEqual(box());
  });
});

describe("isFixedLayer", () => {
  it("treats a phone-width layer as too narrow for a movable frame", () => {
    expect(isFixedLayer({ width: 390, height: 844 })).toBe(true);
    expect(isFixedLayer({ width: FIXED_BELOW - 1, height: 800 })).toBe(true);
  });

  it("leaves a frame movable from the boundary upwards", () => {
    expect(isFixedLayer({ width: FIXED_BELOW, height: 800 })).toBe(false);
    expect(isFixedLayer(LAYER)).toBe(false);
  });

  it("keys off width alone — a short laptop still gets a window", () => {
    expect(isFixedLayer({ width: 1280, height: 400 })).toBe(false);
  });
});
