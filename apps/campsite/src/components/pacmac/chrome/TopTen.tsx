import type { ScoreTable } from "../scores/store";

import styles from "./chrome.module.css";

/** The arcade's roll of honour, shown between games. Nothing to show, nothing drawn. */
export default function TopTen({ table }: { table: ScoreTable }) {
  if (table.length === 0) return null;
  return (
    <div className={styles.topTen}>
      <p className={styles.label} id="macman-top-ten">
        Top ten
      </p>
      <ol className={styles.ranks} aria-labelledby="macman-top-ten">
        {table.map((entry, i) => (
          <li key={`${i}-${entry.initials}-${entry.score}`} className={styles.rank}>
            <span className={styles.place}>{i + 1}</span>
            <span className={styles.who}>{entry.initials ?? "---"}</span>
            <span className={styles.points}>{entry.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
