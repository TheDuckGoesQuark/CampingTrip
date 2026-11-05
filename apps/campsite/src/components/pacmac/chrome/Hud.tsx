import styles from "./chrome.module.css";

/** The arcade's top rows: the score so far. */
export default function Hud({ score }: { score: number }) {
  return (
    <div className={styles.hud}>
      <p className={styles.readout}>
        <span className={styles.label}>Score</span>
        <span className={styles.figure}>{score}</span>
      </p>
    </div>
  );
}
