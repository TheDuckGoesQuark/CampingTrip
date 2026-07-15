import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";

import { Button as BaseButton } from "../../primitives/Button";

import styles from "./Button.module.css";

const button = cva(styles.base, {
  variants: {
    variant: {
      solid: styles.solid,
      subtle: styles.subtle,
      ghost: styles.ghost,
      default: styles.default,
    },
    size: {
      sm: styles.sm,
      md: styles.md,
    },
  },
  defaultVariants: { variant: "solid", size: "md" },
});

export interface ButtonProps
  extends
    Omit<ComponentPropsWithoutRef<typeof BaseButton>, "className">,
    VariantProps<typeof button> {}

/**
 * Button — the brand's action control, on Base UI's Button primitive. Closed
 * variant axes (`variant`, `size`); no `className`/`style` escape hatch. For a
 * link-styled button pass Base UI's `render` prop (e.g. `render={<a href=… />}`).
 */
export function Button({ variant, size, ...props }: ButtonProps) {
  return <BaseButton className={button({ variant, size })} {...props} />;
}
