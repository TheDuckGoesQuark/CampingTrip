import { describe, expect, it } from "vitest";

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
  it("names each PNG after its entity, under one folder", () => {
    for (const [key, entry] of Object.entries(SPRITES)) {
      expect(entry.src).toBe(`/images/pacmac/${key}.png`);
    }
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
