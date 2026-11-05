import { describe, expect, it } from "vitest";

import { MAZE } from "../engine/maze";
import { type DrawOp, drawList } from "./drawList";
import { dealtScene, type Scene } from "./scene";

type SpriteOp = Extract<DrawOp, { kind: "sprite" }>;

const sprites = (ops: DrawOp[]) => ops.filter((op): op is SpriteOp => op.kind === "sprite");
const keyed = (ops: DrawOp[], key: string) => sprites(ops).filter((op) => op.key === key);

describe("drawList", () => {
  const dealt = dealtScene(MAZE);

  it("draws the walls first, under everything", () => {
    expect(drawList(dealt)[0]).toEqual({ kind: "maze", flash: false });
  });

  it("draws every pellet of a fresh board", () => {
    const ops = drawList(dealt);
    expect(keyed(ops, "pellet")).toHaveLength(240);
    expect(keyed(ops, "powerPellet")).toHaveLength(4);
  });

  it("puts MacMan at his spawn, centred between two tiles", () => {
    const [macman] = keyed(drawList(dealt), "macman");
    expect(macman).toMatchObject({ x: 13.5 * 8 + 4, y: 23 * 8 + 4, size: 16, dir: "left" });
  });

  it("draws the four ghosts over MacMan", () => {
    const keys = sprites(drawList(dealt)).map((op) => op.key);
    const macman = keys.indexOf("macman");
    for (const ghost of ["blinky", "pinky", "inky", "clyde"] as const) {
      expect(keys.indexOf(ghost)).toBeGreaterThan(macman);
    }
  });

  it("hides the power pellets on the off beat", () => {
    expect(keyed(drawList({ ...dealt, powerLit: false }), "powerPellet")).toHaveLength(0);
  });

  it("opens and closes the mouth as he chomps", () => {
    const frames = [0, 1, 2, 3].map((chomp) => {
      const scene: Scene = { ...dealt, macman: { ...dealt.macman, chomp } };
      return keyed(drawList(scene), "macman")[0].frame;
    });
    expect(frames).toEqual([0, 1, 2, 1]);
  });

  it("spins and shrinks him as he dies", () => {
    const scene: Scene = { ...dealt, macman: { ...dealt.macman, dying: 0.5 } };
    const [macman] = keyed(drawList(scene), "macman");
    expect(macman.scale).toBe(0.5);
    expect(macman.spin).toBeCloseTo(1.5 * Math.PI);
  });

  it("draws a frightened ghost blue, flashing white, or as eyes", () => {
    const look = (ghostLook: Scene["ghosts"][number]["look"], clock = 0) => {
      const scene: Scene = {
        ...dealt,
        clock,
        ghosts: [{ ...dealt.ghosts[0], look: ghostLook }],
      };
      const [ghost] = sprites(drawList(scene)).slice(-1);
      return [ghost.key, ghost.frame];
    };
    expect(look("frightened")).toEqual(["frightened", 0]);
    expect(look("flashing", 0)).toEqual(["frightened", 0]);
    expect(look("flashing", 12)).toEqual(["frightened", 3]);
    expect(look("eyes")).toEqual(["eyes", 0]);
    expect(look("normal", 8)).toEqual(["blinky", 1]);
  });

  it("names the ghost a frightened sprite is drawn from", () => {
    const scene: Scene = { ...dealt, ghosts: [{ ...dealt.ghosts[2], look: "frightened" }] };
    expect(sprites(drawList(scene)).slice(-1)[0]).toMatchObject({
      key: "frightened",
      ghost: "inky",
    });
  });
});
