import { describe, expect, it } from "vitest";

import { FRUITS } from "../engine/fruit";
import { pingPong, SPRITES } from "./manifest";

describe("pingPong", () => {
  it("runs a three-frame strip out and back", () => {
    expect([0, 1, 2, 3, 4, 5].map((step) => pingPong(3, step))).toEqual([0, 1, 2, 1, 0, 1]);
  });

  it("alternates a two-frame strip", () => {
    expect([0, 1, 2, 3].map((step) => pingPong(2, step))).toEqual([0, 1, 0, 1]);
  });

  it("holds a single frame", () => {
    expect(pingPong(1, 7)).toBe(0);
  });
});

describe("SPRITES", () => {
  it("names each PNG after its entity, under one folder, and each fruit's as fruit-<name>", () => {
    expect(SPRITES.macman.src).toBe("/images/pacmac/macman.png");
    expect(SPRITES.eyes.src).toBe("/images/pacmac/eyes.png");
    for (const { name } of FRUITS)
      expect(SPRITES[name].src).toBe(`/images/pacmac/fruit-${name}.png`);
  });

  it("fetches nothing for the pellets, which are always drawn in code", () => {
    expect(SPRITES.pellet.src).toBeNull();
    expect(SPRITES.powerPellet.src).toBeNull();
  });

  it("describes the supplied strips: MacMan in three 48px frames, two ghosts in two", () => {
    expect(SPRITES.macman).toMatchObject({ frames: 3, cell: 48, orientation: "rotate" });
    expect(SPRITES.blinky).toMatchObject({ frames: 2, cell: 48, orientation: "fixed" });
    expect(SPRITES.inky).toMatchObject({ frames: 2, cell: 48, orientation: "fixed" });
  });

  it("gives every ghost a name of its own to show", () => {
    expect(
      (["blinky", "pinky", "inky", "clyde"] as const).map((g) => SPRITES[g].displayName),
    ).toEqual(["Blinky", "Pinky", "Inky", "Clyde"]);
  });
});
