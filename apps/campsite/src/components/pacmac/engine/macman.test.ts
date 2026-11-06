import { describe, expect, it } from "vitest";

import { CORNERING, type MacManState, moveMacMan, QUEUE_HOLD } from "./macman";
import { type Dir, MAZE } from "./maze";

const at = (x: number, y: number, dir: Dir, queued: Dir | null = null): MacManState => ({
  x,
  y,
  dir,
  queued,
  lapsesAt: QUEUE_HOLD,
  stall: 0,
  travelled: 0,
});

describe("moveMacMan", () => {
  it("moves along his direction", () => {
    const moved = moveMacMan(MAZE, at(13.5, 23, "left"), 0.1);
    expect(moved.x).toBeCloseTo(13.4);
    expect(moved.y).toBe(23);
    expect(moved.travelled).toBeCloseTo(0.1);
  });

  it("stops on a tile's centre in front of a wall", () => {
    const moved = moveMacMan(MAZE, at(1.2, 1, "left"), 0.5);
    expect(moved).toMatchObject({ x: 1, y: 1 });
    expect(moveMacMan(MAZE, moved, 0.5)).toMatchObject({ x: 1, y: 1 });
  });

  it("takes a queued turn at the next opening", () => {
    // Row 5 is open from side to side; column 6 runs up from it.
    const moved = moveMacMan(MAZE, at(5.5, 5, "right", "up"), 0.6);
    expect(moved.dir).toBe("up");
    expect(moved.x).toBe(6);
    expect(moved.y).toBeLessThan(5);
    expect(moved.queued).toBeNull();
  });

  it("cuts the corner when the turn is asked for just past the centre", () => {
    const late = CORNERING - 0.05;
    const moved = moveMacMan(MAZE, at(6 + late, 5, "right", "up"), 0.1);
    expect(moved).toMatchObject({ x: 6, dir: "up" });
    expect(moved.y).toBeCloseTo(4.9);
  });

  it("holds a turn into a wall until one opens", () => {
    const moved = moveMacMan(MAZE, at(2.9, 5, "right", "up"), 0.2);
    expect(moved).toMatchObject({ dir: "right", queued: "up" });
    expect(moved.x).toBeCloseTo(3.1);
  });

  it("reverses at once, wherever he is", () => {
    const moved = moveMacMan(MAZE, at(13.5, 23, "left", "right"), 0.1);
    expect(moved.dir).toBe("right");
    expect(moved.x).toBeCloseTo(13.6);
  });

  it("leaves through one side of the tunnel and comes back in at the other", () => {
    let macman = at(0.2, 14, "left");
    for (let i = 0; i < 10; i++) macman = moveMacMan(MAZE, macman, 0.1);
    expect(macman.x).toBeGreaterThan(26);
    expect(macman.y).toBe(14);
  });

  it("takes a turn asked for 0.38 of a tile late, which the play-test missed", () => {
    const moved = moveMacMan(MAZE, at(6.38, 5, "right", "up"), 0.1);
    expect(moved).toMatchObject({ x: 6, dir: "up" });
  });

  it("lets a turn lapse once he has gone a tile and a half without it", () => {
    // Late for the opening up at column 6; the next is column 12. Without the
    // lapse he would turn up there.
    let macman = at(6 + CORNERING + 0.05, 5, "right", "up");
    for (let i = 0; i < 70; i++) macman = moveMacMan(MAZE, macman, 0.1);
    expect(macman.x).toBeGreaterThan(12.5);
    expect(macman).toMatchObject({ dir: "right", queued: null, y: 5 });
    expect(macman.travelled).toBeGreaterThan(QUEUE_HOLD);
  });

  it("holds a touch turn past any distance, until it is taken", () => {
    let macman = { ...at(6 + CORNERING + 0.05, 5, "right", "up"), lapsesAt: Infinity };
    for (let i = 0; i < 70; i++) macman = moveMacMan(MAZE, macman, 0.1);
    expect(macman).toMatchObject({ x: 12, dir: "up", queued: null });
  });

  it("still takes a turn asked for a tile early", () => {
    let macman = at(5, 5, "right", "up");
    for (let i = 0; i < 12; i++) macman = moveMacMan(MAZE, macman, 0.1);
    expect(macman.dir).toBe("up");
  });
});
