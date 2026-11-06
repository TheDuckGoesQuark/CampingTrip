/** The engine runs at a fixed rate, whatever the display's. */
export const TICKS_PER_SECOND = 60;

export const seconds = (s: number) => Math.round(s * TICKS_PER_SECOND);

/** The arcade's top speed, 75.75 pixels a second over 8-pixel tiles, per tick. */
const FULL_SPEED = 75.75 / 8 / TICKS_PER_SECOND;

/** Fractions of full speed, as the first level sets them. */
export const SPEED = {
  macman: 0.8 * FULL_SPEED,
  ghost: 0.75 * FULL_SPEED,
  ghostInTunnel: 0.4 * FULL_SPEED,
  ghostInHouse: 0.4 * FULL_SPEED,
  macmanPowered: 0.9 * FULL_SPEED,
  ghostFrightened: 0.5 * FULL_SPEED,
  eyes: 1.6 * FULL_SPEED,
};

export const POINTS = { pellet: 10, power: 50 };

/** Each ghost eaten on one power pellet is worth double the last. */
export const GHOST_POINTS: readonly number[] = [200, 400, 800, 1600];

/** How long a power pellet frightens the ghosts, and the flashing warning at its end. */
export const FRIGHT_TICKS = seconds(6);
export const FRIGHT_FLASH_TICKS = seconds(2);

/** Everything stops for a beat while an eaten ghost's points show. */
export const GHOST_EATEN_TICKS = seconds(1);

/** How long a fruit waits to be eaten, and its points show once it is. */
export const FRUIT_TICKS = seconds(9.5);
export const POPUP_TICKS = seconds(2);

/** Ticks MacMan stands still to eat, which is what slows him through a corridor of pellets. */
export const STALL = { pellet: 1, power: 3 };

/** How long "READY!" shows before a new game starts moving, and before a new life does. */
export const READY_TICKS = seconds(4);
export const READY_AFTER_DEATH_TICKS = seconds(2);

export const LIVES = 3;

/**
 * Scatter, chase, scatter, chase and so on: the first level's timings, after
 * which the ghosts chase for good. The clock stops while they are frightened.
 */
export const HUNT_SCHEDULE: readonly number[] = [7, 20, 7, 20, 5, 20, 5].map(seconds);

/**
 * Pellets eaten before each ghost leaves the house: counted from the start of
 * the board, and after a death from the start of the new life, when they come
 * out sooner.
 */
export const RELEASE_DOTS = {
  fresh: { pinky: 0, inky: 30, clyde: 90 },
  afterDeath: { pinky: 7, inky: 17, clyde: 32 },
} as const;

/** A player who stops eating cannot keep the ghosts in: the next one leaves after this long. */
export const RELEASE_IDLE_TICKS = seconds(4);

/** Everything stops for a beat when MacMan is caught, then he spins away. */
export const CAUGHT_TICKS = seconds(1);
export const DEATH_SPIN_TICKS = seconds(1.5);

/** How long the walls flash before the win screen. */
export const CLEARED_TICKS = seconds(2);

/** Ticks per beat of the power pellets' blink. */
export const BLINK_TICKS = 10;
