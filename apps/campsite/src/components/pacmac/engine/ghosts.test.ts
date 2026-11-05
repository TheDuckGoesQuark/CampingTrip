import { describe, expect, it } from "vitest";

import {
  chaseTarget,
  chooseDir,
  CORNERS,
  type Ghost,
  inHouse,
  type Quarry,
  roam,
  targetOf,
  touching,
} from "./ghosts";
import { MAZE } from "./maze";

const quarry = (over: Partial<Quarry> = {}): Quarry => ({
  tile: { x: 10, y: 10 },
  dir: "right",
  blinky: { x: 6, y: 10 },
  ...over,
});

const ghost = (over: Partial<Ghost>): Ghost => ({
  name: "blinky",
  x: 0,
  y: 0,
  dir: "left",
  mode: "active",
  ...over,
});

describe("chaseTarget", () => {
  it("sends Blinky straight at MacMan's tile", () => {
    expect(chaseTarget("blinky", { x: 1, y: 1 }, quarry())).toEqual({ x: 10, y: 10 });
  });

  it("sends Pinky four tiles ahead of him", () => {
    expect(chaseTarget("pinky", { x: 1, y: 1 }, quarry())).toEqual({ x: 14, y: 10 });
    expect(chaseTarget("pinky", { x: 1, y: 1 }, quarry({ dir: "up" }))).toEqual({ x: 10, y: 6 });
  });

  it("sends Inky as far past two tiles ahead as Blinky is behind that point", () => {
    // Two ahead is (12, 10); Blinky is 6 behind it, so Inky aims 6 beyond.
    expect(chaseTarget("inky", { x: 1, y: 1 }, quarry())).toEqual({ x: 18, y: 10 });
    expect(chaseTarget("inky", { x: 1, y: 1 }, quarry({ blinky: { x: 12, y: 14 } }))).toEqual({
      x: 12,
      y: 6,
    });
  });

  it("sends Clyde at MacMan from afar, and to his corner from within eight tiles", () => {
    expect(chaseTarget("clyde", { x: 10, y: 19 }, quarry())).toEqual({ x: 10, y: 10 });
    expect(chaseTarget("clyde", { x: 10, y: 17 }, quarry())).toEqual(CORNERS.clyde);
  });
});

describe("targetOf", () => {
  it("sends every ghost to its own corner while scattering", () => {
    for (const name of ["blinky", "pinky", "inky", "clyde"] as const) {
      expect(targetOf(ghost({ name }), "scatter", quarry(), MAZE)).toEqual(CORNERS[name]);
    }
  });
});

describe("chooseDir", () => {
  it("never turns back, even towards its target", () => {
    // On row 5, heading right, with the target behind to the left.
    expect(chooseDir(MAZE, { x: 3, y: 5, dir: "right" }, { x: 0, y: 5 })).toBe("right");
  });

  it("takes the open way whose next tile is nearest the target", () => {
    // At (6, 5) heading right: up, down and on are open.
    expect(chooseDir(MAZE, { x: 6, y: 5, dir: "right" }, { x: 6, y: 0 })).toBe("up");
    expect(chooseDir(MAZE, { x: 6, y: 5, dir: "right" }, { x: 6, y: 30 })).toBe("down");
    expect(chooseDir(MAZE, { x: 6, y: 5, dir: "right" }, { x: 27, y: 5 })).toBe("right");
  });

  it("breaks a tie up first, then left, then down", () => {
    // Up and down from (6, 5) are equally far from a target level with it.
    expect(chooseDir(MAZE, { x: 6, y: 5, dir: "left" }, { x: 6, y: 5 })).toBe("up");
  });

  it("will not turn up above the house", () => {
    expect(chooseDir(MAZE, { x: 12, y: 11, dir: "right" }, { x: 12, y: 0 })).not.toBe("up");
  });
});

describe("roam", () => {
  it("moves on along the corridor and turns at a junction towards the target", () => {
    const moved = roam(MAZE, ghost({ x: 5.5, y: 5, dir: "right" }), 1, { x: 6, y: 0 });
    expect(moved).toMatchObject({ x: 6, dir: "up" });
    expect(moved.y).toBeCloseTo(4.5);
  });
});

describe("inHouse", () => {
  it("bobs a waiting ghost about its bay", () => {
    let pinky = ghost({ name: "pinky", ...MAZE.spawns.pinky, dir: "down", mode: "house" });
    const ys: number[] = [];
    for (let i = 0; i < 40; i++) {
      pinky = inHouse(MAZE, pinky, 0.05);
      ys.push(pinky.y);
    }
    expect(Math.max(...ys)).toBeLessThanOrEqual(MAZE.spawns.pinky.y + 0.55);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(MAZE.spawns.pinky.y - 0.55);
  });

  it("walks a released ghost to the door's column, out, and loose", () => {
    let inky = ghost({ name: "inky", ...MAZE.spawns.inky, dir: "up", mode: "leaving" });
    for (let i = 0; i < 200 && inky.mode === "leaving"; i++) inky = inHouse(MAZE, inky, 0.1);
    expect(inky).toMatchObject({ mode: "active", dir: "left", ...MAZE.spawns.blinky });
  });
});

describe("touching", () => {
  it("counts the two ends of the tunnel as side by side", () => {
    expect(touching(MAZE, { x: -0.3, y: 14 }, { x: 27.2, y: 14 })).toBe(true);
    expect(touching(MAZE, { x: 3, y: 5 }, { x: 4, y: 5 })).toBe(false);
  });
});
