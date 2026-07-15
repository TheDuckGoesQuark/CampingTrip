import type { ReactNode } from "react";

import styles from "./Window.module.css";

export interface WindowProps {
  /** Title shown centred in the title bar. */
  title?: string;
  /** Fires when the red traffic light or the backdrop is clicked. */
  onClose?: () => void;
  children: ReactNode;
}

/**
 * A floating desktop-style window: dimmed backdrop, macOS traffic lights, a
 * centred title, and scrollable content. Pure chrome nested inside a takeover
 * (e.g. a CatOS post window). Clicking the backdrop or the red light calls
 * `onClose`. Not a focus-trapping dialog — it lives inside one.
 */
export function Window({ title, onClose, children }: WindowProps) {
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.window} onClick={(e) => e.stopPropagation()}>
        <div className={styles.titlebar}>
          <div className={styles.lights}>
            <button
              type="button"
              aria-label="Close"
              className={`${styles.light} ${styles.lightClose}`}
              onClick={(e) => {
                e.stopPropagation();
                onClose?.();
              }}
            >
              ✕
            </button>
            <span className={`${styles.light} ${styles.lightAmber}`} />
            <span className={`${styles.light} ${styles.lightGreen}`} />
          </div>
          <span className={styles.title}>{title}</span>
          <span className={styles.titleSpacer} />
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
