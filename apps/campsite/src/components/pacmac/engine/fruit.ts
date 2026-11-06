/**
 * The fruit, in the order they appear. Each is drawn from `fruit-<name>.png`;
 * adding one is a line here and its PNG. A board shows two, cycling through
 * this list.
 */
export const FRUITS = [{ name: "cat", points: 100 }] as const;

export type FruitName = (typeof FRUITS)[number]["name"];

/** Pellets eaten on the board, power pellets included, when each fruit appears. */
export const FRUIT_AT_DOTS: readonly number[] = [70, 170];

export function fruitFor(appearance: number): (typeof FRUITS)[number] {
  return FRUITS[appearance % FRUITS.length];
}
