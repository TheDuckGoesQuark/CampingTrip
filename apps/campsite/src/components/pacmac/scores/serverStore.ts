import { type HighScoreStore, parseTable, type ScoreTable } from "./store";

export const SCORES_ENDPOINT = "/api/pacmac/scores";

/** Long enough for a cold Lambda, short enough that a dead one does not hold up the game-over screen. */
const TIMEOUT_MS = 4000;

async function tableFrom(response: Response): Promise<ScoreTable> {
  if (!response.ok) throw new Error(`leaderboard answered ${response.status}`);
  const body: unknown = await response.json();
  if (typeof body !== "object" || body === null) throw new Error("leaderboard answered nonsense");
  return parseTable((body as { scores?: unknown }).scores);
}

/**
 * The top ten everyone shares, from the leaderboard endpoint. Any failure,
 * from an unreachable server to an answer that is not a table, falls back to
 * this browser's own table, so the game never goes without one.
 */
export function serverScoreStore({
  fallback,
  endpoint = SCORES_ENDPOINT,
  request = (input, init) => fetch(input, init),
}: {
  fallback: HighScoreStore;
  endpoint?: string;
  request?: (input: string, init?: RequestInit) => Promise<Response>;
}): HighScoreStore {
  const call = (init?: RequestInit) =>
    request(endpoint, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) }).then(tableFrom);
  return {
    read: () => call().catch(() => fallback.read()),
    write: (entry) =>
      call({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      }).catch(() => fallback.write(entry)),
  };
}
