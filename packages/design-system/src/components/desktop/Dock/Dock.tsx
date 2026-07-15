import type { ReactNode } from "react";

import styles from "./Dock.module.css";

export interface DockProps {
  children: ReactNode;
}

/** A floating macOS-style dock, pinned to the bottom-centre of its parent. */
export function Dock({ children }: DockProps) {
  return <div className={styles.dock}>{children}</div>;
}

export interface DockItemProps {
  /** Tooltip label shown on hover. */
  label: string;
  /** The icon (usually an emoji). */
  children: ReactNode;
}

/** A single dock icon that magnifies and shows a tooltip on hover. */
export function DockItem({ label, children }: DockItemProps) {
  return (
    <div className={styles.item} title={label}>
      {children}
      <span className={styles.tooltip}>{label}</span>
    </div>
  );
}

/** A thin vertical separator for grouping dock items. */
export function DockDivider() {
  return <div className={styles.divider} />;
}
