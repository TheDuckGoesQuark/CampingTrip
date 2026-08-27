import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";

import { useRender, type UseRenderRenderProp } from "../../primitives/useRender";

import styles from "./Card.module.css";

const card = cva(styles.base, {
  variants: {
    tone: { surface: styles.surface, sunken: styles.sunken, subtle: styles.subtle },
    elevation: { flat: styles.flat, raised: styles.raised, floating: styles.floating },
    padding: { sm: styles.padSm, md: styles.padMd },
  },
  defaultVariants: { tone: "surface", elevation: "flat", padding: "md" },
});

export interface CardProps
  extends Omit<ComponentPropsWithoutRef<"div">, "className">, VariantProps<typeof card> {
  /**
   * Replace the rendered element — `render={<a href=… />}` makes the whole card
   * one link. Hover and focus affordances key off the element itself, so there
   * is no separate "interactive" flag to forget.
   */
  render?: UseRenderRenderProp;
}

/**
 * Card — a boxy bordered surface. `elevation` moves border weight and hard
 * shadow together, because a 1px border with a 4px drop shadow never reads as
 * one object; `tone` picks the fill.
 */
export function Card({ tone, elevation, padding, render, ...props }: CardProps) {
  return useRender({
    render,
    defaultTagName: "div",
    props: { className: card({ tone, elevation, padding }), ...props },
  });
}
