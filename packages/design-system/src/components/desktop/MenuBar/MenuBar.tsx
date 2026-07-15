import type { ReactNode } from "react";

import styles from "./MenuBar.module.css";

export interface MenuBarProps {
  /** Left-aligned items (app name, menus). */
  left?: ReactNode;
  /** Right-aligned items (clock, status). */
  right?: ReactNode;
}

/**
 * A translucent desktop menu bar pinned to the top of its positioned parent.
 * Pure chrome — pass whatever belongs on the left and right.
 */
export function MenuBar({ left, right }: MenuBarProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.left}>{left}</div>
      <div className={styles.right}>{right}</div>
    </div>
  );
}
