import { asset } from "../../../utils/assetPath";
import { FRUITS, type FruitName } from "../engine/fruit";
import type { GhostName } from "../engine/ghosts";

export type { FruitName, GhostName };

export type SpriteKey =
  | "macman"
  | GhostName
  | "frightened"
  | "eyes"
  | "pellet"
  | "powerPellet"
  | FruitName;

/**
 * How a sprite drawn facing right is turned to face another way. MacMan turns
 * his whole body. A ghost is drawn front-on, so it faces whichever way it goes
 * without turning; only the eyes look left or right.
 */
export type Orientation = "rotate" | "mirror" | "fixed";

export interface SpriteEntry {
  /** One PNG per entity: frames left to right, each `cell` pixels square. `null` is always code-drawn. */
  src: string | null;
  frames: number;
  /**
   * Three device pixels per board pixel: 48 for an actor, which covers two
   * tiles, and 24 for a pellet's single tile.
   */
  cell: number;
  orientation: Orientation;
  /** What the chrome calls it, so a ghost can be renamed without touching the rule it is named for. */
  displayName: string;
}

export interface GhostEntry extends SpriteEntry {
  /** The ghost's own colour, for its placeholder and anything that colour-codes it. */
  colour: string;
}

const ACTOR = 48;
const PELLET = 24;

const png = (name: string) => asset(`images/pacmac/${name}.png`);

const ghost = (key: GhostName, displayName: string, colour: string): GhostEntry => ({
  src: png(key),
  frames: 2,
  cell: ACTOR,
  orientation: "fixed",
  displayName,
  colour,
});

export const GHOSTS: Readonly<Record<GhostName, GhostEntry>> = {
  blinky: ghost("blinky", "Blinky", "#ff0000"),
  pinky: ghost("pinky", "Pinky", "#ffb8ff"),
  inky: ghost("inky", "Inky", "#22c55e"),
  clyde: ghost("clyde", "Clyde", "#ffb852"),
};

export const SPRITES: Readonly<Record<SpriteKey, SpriteEntry>> = {
  macman: {
    src: png("macman"),
    frames: 3,
    cell: ACTOR,
    orientation: "rotate",
    displayName: "MacMan",
  },
  ...GHOSTS,
  /**
   * Blue frames then white, the white for a ghost about to recover. Until this
   * file exists each ghost is drawn as its own sprite, tinted.
   */
  frightened: {
    src: png("frightened"),
    frames: 4,
    cell: ACTOR,
    orientation: "fixed",
    displayName: "Frightened ghost",
  },
  eyes: { src: png("eyes"), frames: 1, cell: ACTOR, orientation: "mirror", displayName: "Eyes" },
  pellet: {
    src: null,
    frames: 1,
    cell: PELLET,
    orientation: "fixed",
    displayName: "Pellet",
  },
  powerPellet: {
    src: null,
    frames: 1,
    cell: PELLET,
    orientation: "fixed",
    displayName: "Power pellet",
  },
  ...(Object.fromEntries(
    FRUITS.map(({ name }) => [
      name,
      {
        src: png(`fruit-${name}`),
        frames: 1,
        cell: ACTOR,
        orientation: "fixed",
        displayName: name.charAt(0).toUpperCase() + name.slice(1),
      },
    ]),
  ) as Record<FruitName, SpriteEntry>),
};

/** Animation runs out and back, so a three-frame mouth goes open, half, shut, half. */
export function pingPong(frames: number, step: number): number {
  if (frames <= 1) return 0;
  const period = 2 * (frames - 1);
  const phase = ((step % period) + period) % period;
  return phase < frames ? phase : period - phase;
}
