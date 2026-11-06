import styles from "./chrome.module.css";

/** The arcade's top rows: this game's score, and the best yet, which it overtakes live. */
export default function Hud({ score, best }: { score: number; best: number }) {
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
      <span className={styles.balance} aria-hidden />
    </div>
  );
}
