import { FRUIT_AT_DOTS, fruitFor } from "./fruit";
import { countFood, type Maze } from "./maze";
import { GHOST_POINTS, POINTS } from "./rules";

/**
 * The most one board can be worth: every pellet, all four ghosts on every power
 * pellet, and every fruit. Nothing scores after the board is cleared, so no
 * honest game ends above it.
 */
export function maxScore(maze: Maze): number {
  const pellets = countFood(maze.food, "pellet");
  const powers = countFood(maze.food, "power");
  const ghosts = GHOST_POINTS.reduce((sum, points) => sum + points, 0);
  const fruit = FRUIT_AT_DOTS.reduce((sum, _, i) => sum + fruitFor(i).points, 0);
  return pellets * POINTS.pellet + powers * (POINTS.power + ghosts) + fruit;
}
