import { describe, expect, it } from "vitest";

import { cellAt, countFood, MAZE, parseMaze } from "./maze";

describe("the classic maze", () => {
  it("is 28 tiles by 31", () => {
    expect(MAZE.width).toBe(28);
    expect(MAZE.height).toBe(31);
  });

  it("holds 240 pellets and 4 power pellets", () => {
    expect(countFood(MAZE.food, "pellet")).toBe(240);
    expect(countFood(MAZE.food, "power")).toBe(4);
  });

  it("puts each spawn between its two letters", () => {
    expect(MAZE.spawns.macman).toEqual({ x: 13.5, y: 23 });
    expect(MAZE.spawns.blinky).toEqual({ x: 13.5, y: 11 });
    expect(MAZE.spawns.pinky).toEqual({ x: 13.5, y: 14 });
    expect(MAZE.spawns.inky).toEqual({ x: 11.5, y: 14 });
    expect(MAZE.spawns.clyde).toEqual({ x: 15.5, y: 14 });
    expect(MAZE.spawns.fruit).toEqual({ x: 13.5, y: 17 });
  });

  it("leaves a spawn's tiles as open floor", () => {
    expect(cellAt(MAZE, 13, 23)).toBe("floor");
    expect(cellAt(MAZE, 14, 14)).toBe("floor");
  });

  it("closes the ghost house with a door", () => {
    expect(cellAt(MAZE, 13, 12)).toBe("door");
    expect(cellAt(MAZE, 14, 12)).toBe("door");
    expect(cellAt(MAZE, 12, 12)).toBe("wall");
  });

  it("wraps a column off either side into the tunnel", () => {
    expect(cellAt(MAZE, -1, 14)).toBe("tunnel");
    expect(cellAt(MAZE, 28, 14)).toBe("tunnel");
    expect(cellAt(MAZE, -1, 14)).toBe(cellAt(MAZE, 27, 14));
  });

  it("treats above and below the board as void", () => {
    expect(cellAt(MAZE, 5, -1)).toBe("void");
    expect(cellAt(MAZE, 5, 31)).toBe("void");
  });
});

describe("parseMaze", () => {
  const spawns = ["MM", "BB", "PP", "II", "CC", "FF"].join("");

  it("refuses rows of different widths", () => {
    expect(() => parseMaze(`${spawns}\n#`)).toThrow("differ in width");
  });

  it("refuses a spawn not written as a pair", () => {
    expect(() => parseMaze(spawns.replace("MM", "M."))).toThrow("two macman letters");
  });
});
