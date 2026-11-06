import { type HighScoreStore, parseTable, placed, type ScoreTable } from "./store";

const KEY = "macman-scores";

/**
 * This browser's own table. Storage can be missing or refuse, in a private
 * window or with site data blocked, and then the table is simply empty.
 */
export function localScoreStore(
  storage: () => Storage = () => window.localStorage,
): HighScoreStore {
  const load = (): ScoreTable => {
    try {
      return parseTable(JSON.parse(storage().getItem(KEY) ?? "[]"));
    } catch {
      return [];
    }
  };
  return {
    read: async () => load(),
    write: async (entry) => {
      const table = placed(load(), entry);
      try {
        storage().setItem(KEY, JSON.stringify(table));
      } catch {
        // Kept for this game only; the next visit starts empty.
      }
      return table;
    },
  };
}
