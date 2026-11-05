import { useCallback, useEffect, useRef, useState } from "react";

import type { GameState } from "../engine/state";
import { type HighScoreStore, qualifies, type ScoreTable } from "./store";

const finished = (state: GameState) => state.phase === "gameOver" || state.phase === "won";

export interface HighScores {
  table: ScoreTable;
  /** The score waiting for initials, while the game-over screen asks for them. */
  asking: number | null;
  submit(initials: string): void;
}

/**
 * The table, read when the game opens. When a game ends on a score that makes
 * it, the player is asked for initials and the entry is written once they are
 * given. Writing belongs here, not in the reducer, which knows nothing of
 * storage.
 */
export function useHighScores(store: HighScoreStore, state: GameState): HighScores {
  const [table, setTable] = useState<ScoreTable>([]);
  const [asking, setAsking] = useState<number | null>(null);
  const ended = useRef(finished(state));
  const latestTable = useRef(table);
  useEffect(() => {
    latestTable.current = table;
  }, [table]);

  useEffect(() => {
    let current = true;
    void store.read().then((read) => current && setTable(read));
    return () => {
      current = false;
    };
  }, [store]);

  const over = finished(state);
  const { score } = state.round;
  useEffect(() => {
    const justEnded = over && !ended.current;
    ended.current = over;
    if (!over) setAsking(null);
    if (justEnded && qualifies(latestTable.current, score)) setAsking(score);
  }, [over, score]);

  const submit = useCallback(
    (initials: string) => {
      if (asking === null) return;
      setAsking(null);
      void store.write({ initials, score: asking }).then(setTable);
    },
    [asking, store],
  );

  return { table, asking, submit };
}
