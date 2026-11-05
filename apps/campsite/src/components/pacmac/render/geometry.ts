/** One tile in board pixels, the arcade's own size. Everything else is a multiple. */
export const TILE = 8;

/** Actors are two tiles across, centred on the tile they occupy. */
export const ACTOR_SIZE = 2 * TILE;

export const BOARD_TILES = { width: 28, height: 31 };

export const BOARD_PX = { width: BOARD_TILES.width * TILE, height: BOARD_TILES.height * TILE };

/** The board-pixel centre of a tile position. */
export function centreOf(tiles: number): number {
  return tiles * TILE + TILE / 2;
}
