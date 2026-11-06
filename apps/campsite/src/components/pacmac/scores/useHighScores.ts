import { useEffect, useRef, useState } from "react";

import type { GameState } from "../engine/state";
import type { HighScoreStore, ScoreTable } from "./store";

const finished = (state: GameState) => state.phase === "gameOver" || state.phase === "won";

/**
 * The table, read once when the game opens and written when a game ends. The
 * write is the store's side effect of the game finishing, which is why it
 * happens here rather than in the reducer, which knows nothing of storage.
 */
export function useHighScores(store: HighScoreStore, state: GameState): ScoreTable {
  const [table, setTable] = useState<ScoreTable>([]);
  const ended = useRef(finished(state));

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
    if (!justEnded || score === 0) return;
    void store.write({ initials: null, score }).then(setTable);
  }, [over, score, store]);

  return table;
}
