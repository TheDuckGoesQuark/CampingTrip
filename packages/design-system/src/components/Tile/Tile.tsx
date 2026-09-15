import { cva, type VariantProps } from "class-variance-authority";

import { Icon, type IconName } from "../Icon";

import styles from "./Tile.module.css";

const tile = cva(styles.base, {
  variants: {
    size: { sm: styles.sm, md: styles.md, lg: styles.lg },
  },
  defaultVariants: { size: "md" },
});

/** A glyph one step down from the square it sits in, so the border keeps a margin. */
const GLYPH_SIZE = { sm: "md", md: "lg", lg: "xl" } as const;

export interface TileProps extends VariantProps<typeof tile> {
  /** The thing being stood in for. Its first character is what shows when nothing else does. */
  label: string;
  /** Fill colour. Genuinely per-item, so it is set as an internal inline style. */
  color?: string;
  /** Image URL, drawn over the fill. Preferred when given. */
  icon?: string;
  /** Drawn glyph, used when there is no image to show. */
  glyph?: IconName;
}

/**
 * Tile — a hard-edged coloured square carrying an image, a glyph, or an initial,
 * in that order of preference. The initial stands in for an icon or thumbnail
 * that is missing, and reads as deliberate rather than broken.
 * Decorative: the label it abbreviates is expected next to it, so nothing here
 * is announced — an image gets an empty alt rather than a second copy of the label.
 */
export function Tile({ label, color, size, icon, glyph }: TileProps) {
  return (
    <span
      className={tile({ size })}
      style={{ background: color ?? "var(--brand-solid)" }}
      aria-hidden="true"
    >
      {icon ? (
        <img className={styles.image} src={icon} alt="" />
      ) : glyph ? (
        <Icon name={glyph} size={GLYPH_SIZE[size ?? "md"]} />
      ) : (
        label.charAt(0).toUpperCase()
      )}
    </span>
  );
}
