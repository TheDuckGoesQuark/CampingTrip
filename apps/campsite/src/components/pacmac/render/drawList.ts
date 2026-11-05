import type { Dir } from "../engine/maze";
import { MAZE } from "../engine/maze";
import { type GhostName, pingPong, SPRITES, type SpriteKey } from "../sprites/manifest";
import { ACTOR_SIZE, centreOf, TILE } from "./geometry";
import type { GhostLook, Scene } from "./scene";

export type DrawOp =
  | { kind: "maze"; flash: boolean }
  | {
      kind: "sprite";
      key: SpriteKey;
      frame: number;
      /** Board pixels, the sprite's centre. */
      x: number;
      y: number;
      size: number;
      dir: Dir;
      /** Extra turn in radians and shrink factor, for the death spin. */
      spin: number;
      scale: number;
      /** Whose sprite a frightened ghost is drawn from while it has none of its own. */
      ghost?: GhostName;
    };

type SpriteOp = Extract<DrawOp, { kind: "sprite" }>;

/** Ticks per frame of a ghost's walk. */
const GHOST_STRIDE = 8;

/** Ticks per white flash of a frightened ghost about to recover. */
const FLASH_STRIDE = 12;

/** One and a half turns over the death, shrinking to nothing. */
const DEATH_TURNS = 1.5;

function sprite(
  key: SpriteKey,
  frame: number,
  at: { x: number; y: number },
  dir: Dir,
  size: number = ACTOR_SIZE,
): SpriteOp {
  return {
    kind: "sprite",
    key,
    frame,
    x: centreOf(at.x),
    y: centreOf(at.y),
    size,
    dir,
    spin: 0,
    scale: 1,
  };
}

function ghostSprite(look: GhostLook, name: SpriteKey, clock: number): [SpriteKey, number] {
  const walk = Math.floor(clock / GHOST_STRIDE) % 2;
  switch (look) {
    case "normal":
      return [name, pingPong(SPRITES[name].frames, walk)];
    case "frightened":
      return ["frightened", walk];
    case "flashing":
      return ["frightened", (Math.floor(clock / FLASH_STRIDE) % 2) * 2 + walk];
    case "eyes":
      return ["eyes", 0];
  }
}

/**
 * The frame as a list of things to draw, back to front. Pure, so what the board
 * shows can be tested without a canvas.
 */
export function drawList(scene: Scene): DrawOp[] {
  const ops: DrawOp[] = [{ kind: "maze", flash: scene.mazeFlash }];

  scene.food.forEach((item, index) => {
    if (item === "none" || (item === "power" && !scene.powerLit)) return;
    const at = { x: index % MAZE.width, y: Math.floor(index / MAZE.width) };
    ops.push(sprite(item === "pellet" ? "pellet" : "powerPellet", 0, at, "right", TILE));
  });

  if (scene.fruit) ops.push(sprite(scene.fruit.name, 0, scene.fruit, "right"));

  const { macman } = scene;
  const body = sprite("macman", pingPong(SPRITES.macman.frames, macman.chomp), macman, macman.dir);
  if (macman.dying !== null) {
    body.frame = 0;
    body.spin = macman.dying * DEATH_TURNS * 2 * Math.PI;
    body.scale = 1 - macman.dying;
  }
  ops.push(body);

  for (const ghost of scene.ghosts) {
    const [key, frame] = ghostSprite(ghost.look, ghost.name, scene.clock);
    ops.push({ ...sprite(key, frame, ghost, ghost.dir), ghost: ghost.name });
  }
  return ops;
}
