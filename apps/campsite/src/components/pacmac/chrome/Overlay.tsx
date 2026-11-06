import { asset } from "../../../utils/assetPath";
import type { GameState } from "../engine/state";
import type { ScoreTable } from "../scores/store";
import InitialsEntry from "./InitialsEntry";
import TopTen from "./TopTen";

import styles from "./chrome.module.css";

/** Fetched when the game ends, not before: it only exists in that overlay. */
const GAME_OVER_PICTURE = asset("images/pacmac/game-over.png");

/** Whatever the phase puts over the board, if anything. */
export interface OverlayProps {
  state: GameState;
  touch: boolean;
  table: ScoreTable;
  /** Set while a finished game's score waits for initials. */
  onInitials: ((initials: string) => void) | null;
  /** The row just signed, shown in the table once the initials are in. */
  signed: number | null;
}

export default function Overlay({ state, touch, table, onInitials, signed }: OverlayProps) {
  const press = touch ? "tap" : "press space";
  const again = onInitials ? (
    <InitialsEntry onSubmit={onInitials} />
  ) : (
    <p className={styles.prompt}>{press} to play again</p>
  );
  const standing = signed === null ? null : <TopTen table={table} mine={signed} />;
  switch (state.phase) {
    case "attract":
      return (
        <div className={`${styles.band} ${table.length > 0 ? styles.tall : ""}`}>
          <p className={styles.marquee} aria-hidden>
            MACMAN
          </p>
          <TopTen table={table} />
          <p className={styles.prompt}>{press} to start</p>
        </div>
      );
    case "ready":
      return (
        <>
          {/* The game's first READY!, not the one after each life. */}
          {touch && state.round.clock === 0 && <HowToSteer />}
          <p className={styles.ready}>READY!</p>
        </>
      );
    case "paused":
      return (
        <div className={styles.band}>
          <p className={styles.marquee}>PAUSED</p>
          <p className={styles.prompt}>{press} to resume</p>
        </div>
      );
    case "won":
      return (
        <div className={`${styles.band} ${standing ? styles.tall : ""}`}>
          <p className={styles.marquee}>YOU WIN</p>
          <p className={styles.result}>{state.round.score} points</p>
          {standing}
          {again}
        </div>
      );
    case "gameOver":
      return (
        <div className={`${styles.band} ${styles.tall}`}>
          <p className={`${styles.marquee} ${styles.over}`}>GAME OVER</p>
          {standing ? null : (
            <img
              className={styles.picture}
              src={GAME_OVER_PICTURE}
              alt="What happened?"
              width={192}
              height={145}
            />
          )}
          <p className={styles.result}>{state.round.score} points</p>
          {standing}
          {again}
        </div>
      );
    case "playing":
    case "dying":
    case "levelCleared":
      return null;
  }
}

/** The touch controls, taught in the seconds before the first move. */
function HowToSteer() {
  return (
    <div className={styles.howTo}>
      <p className={styles.label}>How to steer</p>
      <ul className={styles.steps}>
        <li>Swipe or press the pad</li>
        <li>A lit arm is your next turn</li>
        <li>Tap the board to pause</li>
      </ul>
    </div>
  );
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
