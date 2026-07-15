import { cva, type VariantProps } from "class-variance-authority";
import { createElement, type ComponentPropsWithoutRef, type ElementType } from "react";

import styles from "./Text.module.css";

const text = cva(styles.base, {
  variants: {
    variant: {
      "title-1": styles["title-1"],
      "title-2": styles["title-2"],
      "title-3": styles["title-3"],
      "title-4": styles["title-4"],
      "body-lg": styles["body-lg"],
      body: styles.body,
      "body-sm": styles["body-sm"],
      label: styles.label,
    },
    tone: {
      default: styles["tone-default"],
      muted: styles["tone-muted"],
      "on-brand": styles["tone-on-brand"],
      link: styles["tone-link"],
    },
    align: {
      start: styles["align-start"],
      center: styles["align-center"],
      end: styles["align-end"],
    },
  },
  defaultVariants: { variant: "body", tone: "default" },
});

/** Default element per variant — headings render as headings for semantics. */
const DEFAULT_TAG: Record<string, ElementType> = {
  "title-1": "h1",
  "title-2": "h2",
  "title-3": "h3",
  "title-4": "h4",
  "body-lg": "p",
  body: "p",
  "body-sm": "p",
  label: "span",
};

export type TextElement = "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4" | "label";

export interface TextProps
  extends Omit<ComponentPropsWithoutRef<"p">, "className" | "color">, VariantProps<typeof text> {
  /** Override the rendered element (e.g. a `span` inside a heading). */
  as?: TextElement;
}

/**
 * Text — owns the brand type scale. `variant` sets size/weight (titles render as
 * `h1`–`h4` by default; override with `as`), `tone` sets colour, `align` sets
 * text-align. Replaces both Mantine `Text` and `Title`. No `className`/`style`.
 */
export function Text({ variant, tone, align, as, ...props }: TextProps) {
  const tag = as ?? DEFAULT_TAG[variant ?? "body"] ?? "p";
  // createElement (not JSX) — a bare ElementType intersects to `never` props in
  // JSX under stricter consumers; this keeps the polymorphic tag well-typed.
  return createElement(tag, { className: text({ variant, tone, align }), ...props });
}
