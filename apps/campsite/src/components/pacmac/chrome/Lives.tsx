import styles from "./chrome.module.css";

/** Spare lives: the one in play is on the board, not down here. */
export default function Lives({ lives }: { lives: number }) {
  const spare = Math.max(0, lives - 1);
  return (
    <p className={styles.lives}>
      <span className={styles.visuallyHidden}>
        {spare === 1 ? "1 spare life" : `${spare} spare lives`}
      </span>
      {Array.from({ length: spare }, (_, i) => (
        <span key={i} className={styles.life} aria-hidden />
      ))}
    </p>
  );
}
