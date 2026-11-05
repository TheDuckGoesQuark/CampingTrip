import { FRUITS } from "../engine/fruit";
import { GHOSTS, type GhostName, SPRITES, type SpriteKey } from "./manifest";

/** A loaded strip, whatever drew it. */
export interface Sheet {
  image: CanvasImageSource;
  frames: number;
  cell: number;
}

type Paint = (ctx: CanvasRenderingContext2D, frame: number) => void;

/** Actors are drawn on a 16-unit grid, the size they take on the board, then scaled up. */
const UNITS = 16;
const ACTOR_CELL = 48;

const PELLET = "#ffb8ae";

/** Open, half, shut: the order the real strip is drawn in. */
const MOUTH_RADIANS = [0.8, 0.4, 0];

function macman(ctx: CanvasRenderingContext2D, frame: number) {
  const mouth = MOUTH_RADIANS[frame];
  ctx.fillStyle = "#ffff00";
  ctx.beginPath();
  ctx.moveTo(8, 8);
  ctx.arc(8, 8, 6.5, mouth / 2, 2 * Math.PI - mouth / 2);
  ctx.closePath();
  ctx.fill();
}

function ghostBody(ctx: CanvasRenderingContext2D, colour: string, frame: number) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(8, 7, 6.5, Math.PI, 0);
  // The hem's points swap with its notches each frame, which reads as walking.
  const teeth = 4;
  const half = 13 / teeth / 2;
  for (let k = 0; k <= teeth * 2; k++) {
    ctx.lineTo(14.5 - k * half, k % 2 === frame % 2 ? 14.5 : 12.5);
  }
  ctx.closePath();
  ctx.fill();
}

function eyes(ctx: CanvasRenderingContext2D, look: number) {
  for (const x of [5.5, 10.5]) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(x, 6.5, 2, 2.5, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "#2121ff";
    ctx.beginPath();
    ctx.arc(x + look, 7, 1.2, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function ghost(name: GhostName): Paint {
  return (ctx, frame) => {
    ghostBody(ctx, GHOSTS[name].colour, frame);
    eyes(ctx, 0);
  };
}

/** One cherry pair stands in for any fruit without its own PNG. */
function fruit(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "#de9751";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(5, 10);
  ctx.quadraticCurveTo(8, 4, 13, 2.5);
  ctx.moveTo(11, 11);
  ctx.quadraticCurveTo(11, 6, 13, 2.5);
  ctx.stroke();
  ctx.fillStyle = "#ff0000";
  for (const [x, y] of [
    [4.5, 11.5],
    [10.5, 12],
  ]) {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
  }
}

interface Recipe {
  frames: number;
  cell: number;
  paint: Paint;
  /** Whether `paint` draws on the 16-unit grid rather than in the cell's own pixels. */
  unitScale: boolean;
}

const actor = (key: SpriteKey, paint: Paint): Recipe => ({
  frames: SPRITES[key].frames,
  cell: ACTOR_CELL,
  paint,
  unitScale: true,
});

/**
 * Pellets stay at board resolution, as hard-edged as the arcade's. A frightened
 * ghost has none: it is the ghost's own sprite, tinted, until its file exists.
 */
const RECIPES: Partial<Record<SpriteKey, Recipe>> = {
  macman: actor("macman", macman),
  blinky: actor("blinky", ghost("blinky")),
  pinky: actor("pinky", ghost("pinky")),
  inky: actor("inky", ghost("inky")),
  clyde: actor("clyde", ghost("clyde")),
  eyes: actor("eyes", (ctx) => eyes(ctx, 1)),
  ...Object.fromEntries(FRUITS.map(({ name }) => [name, actor(name, fruit)])),
  pellet: {
    frames: 1,
    cell: 8,
    unitScale: false,
    paint: (ctx) => {
      ctx.fillStyle = PELLET;
      ctx.fillRect(3, 3, 2, 2);
    },
  },
  powerPellet: {
    frames: 1,
    cell: 8,
    unitScale: false,
    paint: (ctx) => {
      ctx.fillStyle = PELLET;
      ctx.beginPath();
      ctx.arc(4, 4, 4, 0, 2 * Math.PI);
      ctx.fill();
    },
  },
};

/** `null` for a sprite with no placeholder, or with no 2D canvas to draw on, as under jsdom. */
export function placeholder(key: SpriteKey): Sheet | null {
  const recipe = RECIPES[key];
  if (!recipe) return null;
  const canvas = document.createElement("canvas");
  canvas.width = recipe.cell * recipe.frames;
  canvas.height = recipe.cell;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  for (let frame = 0; frame < recipe.frames; frame++) {
    ctx.save();
    ctx.translate(frame * recipe.cell, 0);
    if (recipe.unitScale) ctx.scale(recipe.cell / UNITS, recipe.cell / UNITS);
    recipe.paint(ctx, frame);
    ctx.restore();
  }
  return { image: canvas, frames: recipe.frames, cell: recipe.cell };
}
