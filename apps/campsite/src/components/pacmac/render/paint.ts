import type { Dir } from "../engine/maze";
import { SPRITES } from "../sprites/manifest";
import type { Sheet } from "../sprites/placeholders";
import type { Sheets } from "../sprites/sheets";
import { FRIGHTENED_BLUE, RECOVERING_WHITE, tintedSheet } from "../sprites/tint";
import type { DrawOp } from "./drawList";
import { BOARD_PX } from "./geometry";

export interface Art {
  sheets: Sheets;
  maze: { normal: CanvasImageSource; flash: CanvasImageSource } | null;
}

const QUARTER = Math.PI / 2;

/** The arcade's cyan, in the site's face, at a size that fits a tile and a half. */
const POINTS_COLOUR = "#2ff3f3";
const POINTS_FONT = "800 8px Nunito, sans-serif";

function turn(ctx: CanvasRenderingContext2D, dir: Dir, orientation: "rotate" | "mirror" | "fixed") {
  if (orientation === "fixed") return;
  if (dir === "left") ctx.scale(-1, 1);
  if (orientation === "mirror") return;
  if (dir === "up") ctx.rotate(-QUARTER);
  if (dir === "down") ctx.rotate(QUARTER);
}

type SpriteOp = Extract<DrawOp, { kind: "sprite" }>;

/**
 * The sheet and frame an op draws from. A frightened ghost without its own
 * strip is its ordinary sprite, tinted: frames 0 and 1 blue, 2 and 3 white.
 */
function source(op: SpriteOp, sheets: Sheets): { sheet: Sheet; frame: number } | null {
  const own = sheets[op.key];
  if (own) return { sheet: own, frame: op.frame };
  if (op.key !== "frightened" || !op.ghost) return null;
  const body = sheets[op.ghost];
  const tint = op.frame < 2 ? FRIGHTENED_BLUE : RECOVERING_WHITE;
  const sheet = body && tintedSheet(body, tint);
  return sheet ? { sheet, frame: (op.frame % 2) % sheet.frames } : null;
}

/** Executes a draw list. `scale` is device pixels per board pixel, a whole number. */
export function paint(
  ctx: CanvasRenderingContext2D,
  ops: readonly DrawOp[],
  art: Art,
  scale: number,
) {
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, BOARD_PX.width, BOARD_PX.height);

  for (const op of ops) {
    if (op.kind === "points") {
      ctx.fillStyle = POINTS_COLOUR;
      ctx.font = POINTS_FONT;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(op.text, op.x, op.y);
      continue;
    }
    if (op.kind === "maze") {
      const image = art.maze && (op.flash ? art.maze.flash : art.maze.normal);
      if (image) ctx.drawImage(image, 0, 0, BOARD_PX.width, BOARD_PX.height);
      continue;
    }
    const drawn = source(op, art.sheets);
    if (!drawn || op.scale <= 0) continue;
    const { sheet, frame } = drawn;
    ctx.save();
    ctx.translate(op.x, op.y);
    turn(ctx, op.dir, SPRITES[op.key].orientation);
    ctx.rotate(op.spin);
    ctx.scale(op.scale, op.scale);
    const half = op.size / 2;
    ctx.drawImage(
      sheet.image,
      frame * sheet.cell,
      0,
      sheet.cell,
      sheet.cell,
      -half,
      -half,
      op.size,
      op.size,
    );
    ctx.restore();
  }
}
