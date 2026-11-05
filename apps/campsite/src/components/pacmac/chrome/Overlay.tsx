import type { GameState } from "../engine/state";

import styles from "./chrome.module.css";

/** Whatever the phase puts over the board, if anything. */
export default function Overlay({ state }: { state: GameState }) {
  switch (state.phase) {
    case "attract":
      return (
        <div className={styles.band}>
          <p className={styles.marquee} aria-hidden>
            MACMAN
          </p>
          <p className={styles.prompt}>press space to start</p>
        </div>
      );
    case "ready":
      return <p className={styles.ready}>READY!</p>;
    case "paused":
      return (
        <div className={styles.band}>
          <p className={styles.marquee}>PAUSED</p>
          <p className={styles.prompt}>press space to resume</p>
        </div>
      );
    case "won":
      return (
        <div className={styles.band}>
          <p className={styles.marquee}>YOU WIN</p>
          <p className={styles.result}>{state.round.score} points</p>
          <p className={styles.prompt}>press space to play again</p>
        </div>
      );
    case "gameOver":
      return (
        <div className={styles.band}>
          <p className={`${styles.marquee} ${styles.over}`}>GAME OVER</p>
          <p className={styles.result}>{state.round.score} points</p>
          <p className={styles.prompt}>press space to play again</p>
        </div>
      );
    case "playing":
    case "dying":
    case "levelCleared":
      return null;
  }
}

/** The same news for a screen reader, which sees no board. */
export function announcementFor(state: GameState): string {
  switch (state.phase) {
    case "attract":
      return "Press space to start. Arrow keys or W, A, S and D to move.";
    case "ready":
      return "Ready.";
    case "paused":
      return "Paused. Press space to resume.";
    case "dying":
      return state.round.lives > 1 ? "Caught." : "Caught, on the last life.";
    case "won":
      return `Board cleared, ${state.round.score} points. Press space to play again.`;
    case "gameOver":
      return `Game over, ${state.round.score} points. Press space to play again.`;
    case "playing":
    case "levelCleared":
      return "";
  }
}
