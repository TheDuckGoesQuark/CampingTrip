import type { ScoreTable } from "../scores/store";

import styles from "./chrome.module.css";

/** The arcade's roll of honour, shown between games. Nothing to show, nothing drawn. */
export default function TopTen({
  table,
  mine = null,
}: {
  table: ScoreTable;
  mine?: number | null;
}) {
  if (table.length === 0) return null;
  return (
    <div className={styles.topTen}>
      <p className={styles.label} id="macman-top-ten">
        Top ten
      </p>
      <ol className={styles.ranks} aria-labelledby="macman-top-ten">
        {table.map((entry, i) => (
          <li
            key={`${i}-${entry.initials}-${entry.score}`}
            className={`${styles.rank} ${i === mine ? styles.mine : ""}`}
            aria-current={i === mine ? "true" : undefined}
          >
            <span className={styles.place}>{i + 1}</span>
            <span className={styles.who}>{entry.initials ?? "---"}</span>
            <span className={styles.points}>{entry.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
