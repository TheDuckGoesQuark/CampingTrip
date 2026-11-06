import type { Sheet } from "./placeholders";

export type Rgb = readonly [number, number, number];

export const FRIGHTENED_BLUE: Rgb = [33, 33, 255];
export const RECOVERING_WHITE: Rgb = [222, 222, 255];

/**
 * Multiplies a pixel's brightness by the tint, so the sprite keeps its shading
 * in one colour. Brightness first, or a red ghost multiplied by blue comes out
 * black.
 */
export function tintPixels(data: Uint8ClampedArray, [r, g, b]: Rgb): void {
  for (let i = 0; i < data.length; i += 4) {
    const light = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
    // Lifted, so the darkest outline still reads as part of the ghost.
    const lifted = 0.35 + 0.65 * light;
    data[i] = r * lifted;
    data[i + 1] = g * lifted;
    data[i + 2] = b * lifted;
  }
}

const tinted = new WeakMap<CanvasImageSource, Map<string, Sheet | null>>();

/** A sheet recoloured once and kept, since a frightened ghost is drawn every frame. */
export function tintedSheet(sheet: Sheet, tint: Rgb): Sheet | null {
  let byTint = tinted.get(sheet.image);
  if (!byTint) tinted.set(sheet.image, (byTint = new Map()));
  const key = tint.join(",");
  if (byTint.has(key)) return byTint.get(key) ?? null;

  const canvas = document.createElement("canvas");
  canvas.width = sheet.cell * sheet.frames;
  canvas.height = sheet.cell;
  const ctx = canvas.getContext("2d");
  let result: Sheet | null = null;
  if (ctx) {
    ctx.drawImage(sheet.image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    tintPixels(pixels.data, tint);
    ctx.putImageData(pixels, 0, 0);
    result = { ...sheet, image: canvas };
  }
  byTint.set(key, result);
  return result;
}
