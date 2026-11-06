import type { MouseEvent, PointerEvent } from "react";

import type { Dir } from "../engine/maze";

import styles from "./DPad.module.css";

const ARMS: readonly Dir[] = ["up", "left", "right", "down"];

export interface DPadProps {
  /** The turn the game is holding, lit until MacMan takes it. */
  queued: Dir | null;
  onHold(dir: Dir): void;
}

/** A handheld's cross-shaped pad: a press holds that turn until MacMan can take it. */
export default function DPad({ queued, onHold }: DPadProps) {
  return (
    <div className={styles.pad} role="group" aria-label="Direction pad">
      {ARMS.map((dir) => (
        <button
          key={dir}
          type="button"
          className={`${styles.arm} ${styles[dir]}`}
          aria-label={dir}
          aria-pressed={queued === dir}
          // On the press rather than the release, and without taking focus,
          // which would blur the game and pause it.
          onPointerDown={(event: PointerEvent) => {
            event.preventDefault();
            onHold(dir);
          }}
          // A click with no pointer behind it, from a keyboard or a screen reader.
          onClick={(event: MouseEvent) => {
            if (event.detail === 0) onHold(dir);
          }}
        />
      ))}
      <span className={styles.hub} aria-hidden />
    </div>
  );
}
