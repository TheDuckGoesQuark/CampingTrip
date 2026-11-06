import type { Dir } from "../engine/maze";

import styles from "./DPad.module.css";

const ARMS: readonly Dir[] = ["up", "left", "right", "down"];

/**
 * A handheld's cross-shaped pad, drawn only: the touches are read for the
 * whole area around it, so it shows the turn being held rather than taking it.
 */
export default function DPad({ queued }: { queued: Dir | null }) {
  return (
    <div className={styles.pad} aria-hidden>
      {ARMS.map((dir) => (
        <span
          key={dir}
          className={`${styles.arm} ${styles[dir]} ${queued === dir ? styles.lit : ""}`}
        />
      ))}
      <span className={styles.hub} />
    </div>
  );
}
