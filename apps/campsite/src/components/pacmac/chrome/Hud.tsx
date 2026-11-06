import { Pause, Play } from "@jordanscamp/ds/icons";

import styles from "./chrome.module.css";

export interface HudProps {
  score: number;
  best: number;
  /** A touch screen's pause button, while there is a game to pause or resume. */
  pause?: { paused: boolean; toggle(): void } | null;
}

/** The arcade's top rows: this game's score, and the best yet, which it overtakes live. */
export default function Hud({ score, best, pause = null }: HudProps) {
  return (
    <div className={styles.hud}>
      <p className={styles.readout}>
        <span className={styles.label}>Score</span>
        <span className={styles.figure}>{score}</span>
      </p>
      <p className={`${styles.readout} ${styles.centred}`}>
        <span className={styles.label}>Hi-score</span>
        <span className={styles.figure}>{Math.max(score, best)}</span>
      </p>
      <span className={styles.balance}>
        {pause && (
          <button
            type="button"
            className={styles.pause}
            aria-label={pause.paused ? "resume" : "pause"}
            onClick={pause.toggle}
          >
            {pause.paused ? (
              <Play weight="fill" aria-hidden />
            ) : (
              <Pause weight="fill" aria-hidden />
            )}
          </button>
        )}
      </span>
    </div>
  );
}
