import GRID from "./maze.txt?raw";

export type Dir = "up" | "left" | "down" | "right";

/** A position in tiles. A whole number is a tile's centre; spawns sit on a half. */
export interface Point {
  x: number;
  y: number;
}

/** `void` is the dead space outside the outer wall, which is drawn as nothing at all. */
export type Cell = "wall" | "door" | "floor" | "tunnel" | "void";

export type Food = "none" | "pellet" | "power";

export type Spawn = "macman" | "blinky" | "pinky" | "inky" | "clyde" | "fruit";

export interface Maze {
  width: number;
  height: number;
  /** Row-major, `y * width + x`. */
  cells: readonly Cell[];
  food: readonly Food[];
  spawns: Readonly<Record<Spawn, Point>>;
}

const CELLS: Record<string, Cell> = {
  "#": "wall",
  "-": "door",
  "=": "tunnel",
  _: "void",
};

const FOOD: Record<string, Food> = { ".": "pellet", o: "power" };

/** Each spawn is written as a pair of letters, and stands between the two. */
const SPAWN_LETTERS: Record<string, Spawn> = {
  M: "macman",
  B: "blinky",
  P: "pinky",
  I: "inky",
  C: "clyde",
  F: "fruit",
};

export function parseMaze(text: string): Maze {
  const rows = text.split("\n").filter((row) => row !== "");
  const width = rows[0].length;
  if (rows.some((row) => row.length !== width)) throw new Error("maze rows differ in width");

  const cells: Cell[] = [];
  const food: Food[] = [];
  const found: Partial<Record<Spawn, Point[]>> = {};
  rows.forEach((row, y) => {
    [...row].forEach((char, x) => {
      cells.push(CELLS[char] ?? "floor");
      food.push(FOOD[char] ?? "none");
      const spawn = SPAWN_LETTERS[char];
      if (spawn) (found[spawn] ??= []).push({ x, y });
    });
  });

  const spawns = Object.fromEntries(
    Object.values(SPAWN_LETTERS).map((spawn) => {
      const pair = found[spawn];
      if (pair?.length !== 2) throw new Error(`maze needs exactly two ${spawn} letters`);
      return [spawn, { x: (pair[0].x + pair[1].x) / 2, y: (pair[0].y + pair[1].y) / 2 }];
    }),
  ) as Record<Spawn, Point>;

  return { width, height: rows.length, cells, food, spawns };
}

export const MAZE = parseMaze(GRID);

export function indexOf(maze: Maze, x: number, y: number): number {
  return y * maze.width + x;
}

/**
 * The cell at a tile. Off either side is the tunnel's far end, so a column wraps;
 * off the top or bottom is void.
 */
export function cellAt(maze: Maze, x: number, y: number): Cell {
  if (y < 0 || y >= maze.height) return "void";
  const wrapped = ((x % maze.width) + maze.width) % maze.width;
  return maze.cells[indexOf(maze, wrapped, y)];
}

export function countFood(food: readonly Food[], kind: Food): number {
  return food.filter((item) => item === kind).length;
}
