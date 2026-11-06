import { type Cell, cellAt, type Maze } from "../engine/maze";
import { TILE } from "./geometry";

export interface MazeColours {
  wall: string;
  door: string;
}

export const MAZE_COLOURS: MazeColours = { wall: "#2121de", door: "#ffb8ff" };
export const FLASH_COLOURS: MazeColours = { wall: "#dedeff", door: "#000000" };

/** A wall's outline faces anything a player or ghost could stand on. */
function open(cell: Cell): boolean {
  return cell === "floor" || cell === "tunnel" || cell === "door";
}

/**
 * Outlines every wall where it meets open floor, a line one board pixel wide
 * and one pixel back from the floor, so a block of wall reads as a hollow shape.
 * Drawn in board pixels; the caller scales.
 */
export function paintMaze(ctx: CanvasRenderingContext2D, maze: Maze, colours: MazeColours): void {
  const line = 1;
  const gap = 1;
  const inset = gap + line;
  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      const cell = cellAt(maze, x, y);
      const left = x * TILE;
      const top = y * TILE;
      if (cell === "door") {
        ctx.fillStyle = colours.door;
        ctx.fillRect(left, top + TILE / 2 - 1, TILE, 2);
        continue;
      }
      if (cell !== "wall") continue;

      // Off the board's edge counts as closed, or the outer wall would be
      // outlined against nothing; `cellAt` would wrap it round instead.
      const at = (dx: number, dy: number) => {
        const nx = x + dx;
        return nx < 0 || nx >= maze.width ? "void" : cellAt(maze, nx, y + dy);
      };
      const n = open(at(0, -1));
      const s = open(at(0, 1));
      const w = open(at(-1, 0));
      const e = open(at(1, 0));

      // Blue to within `gap` of open sides, then black to within `inset`.
      const outer = {
        x: left + (w ? gap : 0),
        y: top + (n ? gap : 0),
        r: left + TILE - (e ? gap : 0),
        b: top + TILE - (s ? gap : 0),
      };
      ctx.fillStyle = colours.wall;
      ctx.fillRect(outer.x, outer.y, outer.r - outer.x, outer.b - outer.y);
      ctx.fillStyle = "#000000";
      const inner = {
        x: left + (w ? inset : 0),
        y: top + (n ? inset : 0),
        r: left + TILE - (e ? inset : 0),
        b: top + TILE - (s ? inset : 0),
      };
      ctx.fillRect(inner.x, inner.y, inner.r - inner.x, inner.b - inner.y);

      // An inside corner: the floor touches only diagonally, so the line has to
      // turn round it inside this tile.
      for (const [dx, dy] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ]) {
        if (open(at(dx, 0)) || open(at(0, dy)) || !open(at(dx, dy))) continue;
        const cx = dx < 0 ? left : left + TILE - inset;
        const cy = dy < 0 ? top : top + TILE - inset;
        ctx.fillStyle = colours.wall;
        ctx.fillRect(cx, cy, inset, inset);
        ctx.fillStyle = "#000000";
        ctx.fillRect(dx < 0 ? left : left + TILE - gap, dy < 0 ? top : top + TILE - gap, gap, gap);
      }
    }
  }
}
