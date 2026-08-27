/**
 * Window geometry, as pure functions. Kept out of the component because jsdom
 * has no layout — `getBoundingClientRect` is all zeroes there — so this is the
 * only way the sizing and clamping rules can actually be tested.
 *
 * All values are CSS px relative to the window's layer, not the viewport.
 */

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export type WindowSize = "sm" | "md" | "lg";

/**
 * Proportional with a ceiling, so a frame always leaves the desktop chrome
 * visible around it on a large screen and still fits a small one.
 */
const SIZE_HINTS: Record<
  WindowSize,
  { widthRatio: number; maxWidth: number; heightRatio: number; maxHeight: number }
> = {
  sm: { widthRatio: 0.88, maxWidth: 420, heightRatio: 0.52, maxHeight: 320 },
  md: { widthRatio: 0.92, maxWidth: 600, heightRatio: 0.7, maxHeight: 500 },
  lg: { widthRatio: 0.92, maxWidth: 880, heightRatio: 0.78, maxHeight: 660 },
};

/** Below this a window stops being usable, so drags stop shrinking it. */
export const MIN_WIDTH = 280;
export const MIN_HEIGHT = 140;

/**
 * How much of a window must stay within the layer. Enough that its title bar is
 * always grabbable — a window dragged fully off-screen cannot be brought back.
 */
export const KEEP_VISIBLE = 96;

/**
 * Room left above a maximised window, so the menu bar is never covered. Mirrors
 * the `--menubar-height` token, which `MenuBar` sizes itself from — the maths
 * here cannot read a CSS variable, so the two are kept equal by hand.
 */
export const MENU_BAR_HEIGHT = 26;

/** The size a `size` hint resolves to inside a layer of `layer` px. */
export function sizeFor(size: WindowSize, layer: Size): Size {
  const hint = SIZE_HINTS[size];
  return {
    width: Math.max(MIN_WIDTH, Math.min(layer.width * hint.widthRatio, hint.maxWidth)),
    height: Math.max(MIN_HEIGHT, Math.min(layer.height * hint.heightRatio, hint.maxHeight)),
  };
}

/** A window's opening position: centred, which is where a new window belongs. */
export function centre(size: WindowSize, layer: Size): Box {
  const { width, height } = sizeFor(size, layer);
  return {
    x: Math.round((layer.width - width) / 2),
    y: Math.round((layer.height - height) / 2),
    width,
    height,
  };
}

/** The box a maximised window fills. */
export function maximised(layer: Size): Box {
  return {
    x: 0,
    y: MENU_BAR_HEIGHT,
    width: layer.width,
    height: Math.max(MIN_HEIGHT, layer.height - MENU_BAR_HEIGHT),
  };
}

/**
 * Holds a window inside its layer. Vertically it cannot go above the menu bar
 * nor past the bottom edge; horizontally a sliver may hang off either side, so
 * long as `KEEP_VISIBLE` of it remains grabbable.
 */
export function clamp(box: Box, layer: Size): Box {
  return {
    ...box,
    x: Math.min(Math.max(box.x, KEEP_VISIBLE - box.width), layer.width - KEEP_VISIBLE),
    y: Math.min(
      Math.max(box.y, MENU_BAR_HEIGHT),
      Math.max(MENU_BAR_HEIGHT, layer.height - KEEP_VISIBLE),
    ),
  };
}

/** Moves a window by a pointer delta, clamped. */
export function movedBy(box: Box, dx: number, dy: number, layer: Size): Box {
  return clamp({ ...box, x: box.x + dx, y: box.y + dy }, layer);
}

/**
 * Grows a window from its bottom-right corner by a pointer delta. The position
 * is fixed, so a resize never slides the frame out from under the cursor.
 */
export function resizedBy(box: Box, dx: number, dy: number, layer: Size): Box {
  return {
    ...box,
    width: Math.max(MIN_WIDTH, Math.min(box.width + dx, layer.width - box.x)),
    height: Math.max(MIN_HEIGHT, Math.min(box.height + dy, layer.height - box.y)),
  };
}

/** Pulls a window back inside a layer that has changed size under it. */
export function refit(box: Box, layer: Size): Box {
  return clamp(
    {
      ...box,
      width: Math.max(MIN_WIDTH, Math.min(box.width, layer.width)),
      height: Math.max(MIN_HEIGHT, Math.min(box.height, layer.height - MENU_BAR_HEIGHT)),
    },
    layer,
  );
}
