import { cva, type VariantProps } from "class-variance-authority";

import styles from "./Tile.module.css";

const tile = cva(styles.base, {
  variants: {
    size: { sm: styles.sm, md: styles.md, lg: styles.lg },
  },
  defaultVariants: { size: "md" },
});

export interface TileProps extends VariantProps<typeof tile> {
  /** The thing being stood in for. Its first character is what shows. */
  label: string;
  /** Fill colour. Genuinely per-item, so it is set as an internal inline style. */
  color?: string;
}

/**
 * Tile — a hard-edged coloured square carrying an initial. Stands in for an
 * icon or thumbnail that is missing, and reads as deliberate rather than broken.
 * Decorative: the label it abbreviates is expected next to it, so the initial is
 * hidden from assistive tech rather than read out as a stray letter.
 */
export function Tile({ label, color, size }: TileProps) {
  return (
    <span
      className={tile({ size })}
      style={{ background: color ?? "var(--brand-solid)" }}
      aria-hidden="true"
    >
      {label.charAt(0).toUpperCase()}
    </span>
  );
}
