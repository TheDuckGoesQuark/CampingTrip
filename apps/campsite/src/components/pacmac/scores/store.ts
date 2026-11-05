/** A finished game on a table. Initials are `null` until the player is asked for some. */
export interface ScoreEntry {
  initials: string | null;
  score: number;
}

/** Best first, at most `TABLE_SIZE` long. */
export type ScoreTable = readonly ScoreEntry[];

export const TABLE_SIZE = 10;

/** Where high scores are kept. Asynchronous throughout, so a server can stand behind it. */
export interface HighScoreStore {
  read(): Promise<ScoreTable>;
  /** Records a finished game and answers with the table as it now stands. */
  write(entry: ScoreEntry): Promise<ScoreTable>;
}

/** The table with an entry placed in it, if it makes the cut. A tie goes below the scores already there. */
export function placed(table: ScoreTable, entry: ScoreEntry): ScoreTable {
  const at = table.findIndex((existing) => entry.score > existing.score);
  const next = at === -1 ? [...table, entry] : [...table.slice(0, at), entry, ...table.slice(at)];
  return next.slice(0, TABLE_SIZE);
}

/** Whether a score would get onto the table. */
export function qualifies(table: ScoreTable, score: number): boolean {
  return score > 0 && (table.length < TABLE_SIZE || score > table[table.length - 1].score);
}

function isEntry(value: unknown): value is ScoreEntry {
  if (typeof value !== "object" || value === null) return false;
  const { initials, score } = value as Record<string, unknown>;
  return (
    Number.isInteger(score) &&
    (score as number) >= 0 &&
    (initials === null || (typeof initials === "string" && /^[A-Z]{3}$/.test(initials)))
  );
}

/** Reads a stored table back, dropping anything that is not one. */
export function parseTable(raw: unknown): ScoreTable {
  if (!Array.isArray(raw)) return [];
  // `filter` has already copied, so sorting in place touches nothing of the caller's.
  return raw
    .filter(isEntry)
    .sort((a, b) => b.score - a.score)
    .slice(0, TABLE_SIZE);
}
