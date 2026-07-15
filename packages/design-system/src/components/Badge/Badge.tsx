import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";

import styles from "./Badge.module.css";

const badge = cva(styles.base, {
  variants: {
    variant: { light: "", solid: "" },
    tone: { neutral: "", brand: "", accent: "", danger: "" },
  },
  compoundVariants: [
    { variant: "light", tone: "neutral", class: styles.lightNeutral },
    { variant: "light", tone: "brand", class: styles.lightBrand },
    { variant: "light", tone: "accent", class: styles.lightAccent },
    { variant: "light", tone: "danger", class: styles.lightDanger },
    { variant: "solid", tone: "neutral", class: styles.solidNeutral },
    { variant: "solid", tone: "brand", class: styles.solidBrand },
    { variant: "solid", tone: "accent", class: styles.solidAccent },
    { variant: "solid", tone: "danger", class: styles.solidDanger },
  ],
  defaultVariants: { variant: "light", tone: "neutral" },
});

export interface BadgeProps
  extends
    Omit<ComponentPropsWithoutRef<"span">, "className" | "color">,
    VariantProps<typeof badge> {}

/** Badge — a small status/label pill. Closed `variant` × `tone` axes. */
export function Badge({ variant, tone, ...props }: BadgeProps) {
  return <span className={badge({ variant, tone })} {...props} />;
}
