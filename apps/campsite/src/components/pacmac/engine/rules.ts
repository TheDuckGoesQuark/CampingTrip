/** The engine runs at a fixed rate, whatever the display's. */
export const TICKS_PER_SECOND = 60;

export const seconds = (s: number) => Math.round(s * TICKS_PER_SECOND);

/** The arcade's top speed, 75.75 pixels a second over 8-pixel tiles, per tick. */
const FULL_SPEED = 75.75 / 8 / TICKS_PER_SECOND;

/** Fractions of full speed, as the first level sets them. */
export const SPEED = {
  macman: 0.8 * FULL_SPEED,
};

export const POINTS = { pellet: 10, power: 50 };

/** Ticks MacMan stands still to eat, which is what slows him through a corridor of pellets. */
export const STALL = { pellet: 1, power: 3 };

/** How long "READY!" shows before a new game starts moving. */
export const READY_TICKS = seconds(4);

/** Ticks per beat of the power pellets' blink. */
export const BLINK_TICKS = 10;
