import type { Dir } from "../engine/maze";

export type Command = { kind: "move"; dir: Dir } | { kind: "primary" } | { kind: "pause" };

const KEYS: Record<string, Command> = {
  ArrowUp: { kind: "move", dir: "up" },
  ArrowLeft: { kind: "move", dir: "left" },
  ArrowDown: { kind: "move", dir: "down" },
  ArrowRight: { kind: "move", dir: "right" },
  w: { kind: "move", dir: "up" },
  a: { kind: "move", dir: "left" },
  s: { kind: "move", dir: "down" },
  d: { kind: "move", dir: "right" },
  " ": { kind: "primary" },
  p: { kind: "pause" },
  Escape: { kind: "pause" },
};

/** What a key asks for, or `null` for a key the game leaves to the page. */
export function commandFor(key: string): Command | null {
  return KEYS[key.length === 1 ? key.toLowerCase() : key] ?? null;
}
