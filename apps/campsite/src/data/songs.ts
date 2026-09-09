export interface Song {
  title: string;
  artist: string;
  /** Path under `public/`, resolved through `asset()` at load time. */
  src: string;
}

// Empty until a recording is published; the player renders its empty state.
export const songs: Song[] = [];
