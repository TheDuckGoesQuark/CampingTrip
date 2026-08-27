import { cva, type VariantProps } from "class-variance-authority";

import styles from "./Icon.module.css";

/**
 * Paths are stroked, not filled, so a glyph inherits `currentColor` and keeps an
 * even weight at every size. Names describe the *shape*, never what a caller uses
 * it for — the DS has no idea there is a blog behind `document`.
 */
const PATHS = {
  globe:
    "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M3 12h18M12 3c2.6 2.4 2.6 15.6 0 18M12 3c-2.6 2.4-2.6 15.6 0 18",
  house: "M4 11 12 4l8 7v9H4z",
  document: "M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6",
  tag: "M5 5h6l8 8-6 6-8-8zM9 9h.01",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  image: "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6",
  cassette: "M3 6h18v12H3zM7 15h10M8 11h.01M16 11h.01M7 11h10",
  cat: "M4 5l2 4v9h12V9l2-4-5 2H9zM9.5 13h.01M14.5 13h.01M12 16v1",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6",
  reload: "M19 12a7 7 0 1 1-2.1-5M19 4v4h-4",
  "chevron-left": "M14 6l-6 6 6 6",
  "chevron-right": "M10 6l6 6-6 6",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  close: "M6 6l12 12M18 6 6 18",
} as const;

export type IconName = keyof typeof PATHS;

/** Every name the set ships, for story grids and exhaustiveness checks. */
export const ICON_NAMES = Object.keys(PATHS) as readonly IconName[];

const icon = cva(styles.base, {
  variants: {
    size: { sm: styles.sm, md: styles.md, lg: styles.lg },
  },
  defaultVariants: { size: "md" },
});

export interface IconProps extends VariantProps<typeof icon> {
  name: IconName;
  /**
   * Announced name. Omit for a glyph that only decorates adjacent text — the
   * icon is then hidden from assistive tech rather than read as a second label.
   */
  label?: string;
}

/** Icon — one stroked glyph from a closed set, coloured by `currentColor`. */
export function Icon({ name, size, label }: IconProps) {
  return (
    <svg
      className={icon({ size })}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
