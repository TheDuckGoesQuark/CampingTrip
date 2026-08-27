import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";

import { Button as BaseButton } from "../../primitives/Button";
import { useRender, type UseRenderRenderProp } from "../../primitives/useRender";

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
    Omit<ComponentPropsWithoutRef<typeof BaseButton>, "className" | "render">,
    VariantProps<typeof button> {
  /**
   * Substitute the element — in practice, an anchor that should look like a
   * button (`render={<a href=… />}`, or an app's own link component).
   */
  render?: UseRenderRenderProp;
}

/**
 * Button — the brand's action control. Closed variant axes (`variant`, `size`);
 * no `className`/`style` escape hatch.
 *
 * Without `render` it is Base UI's Button, which supplies the accessible button
 * behaviour. With `render` it only lends its appearance: Base UI's job there is
 * to make a *non*-button act like one, and it does that by stamping
 * `role="button"` on whatever it is given — which strips an anchor of the link
 * semantics a reader needs, to replace behaviour the anchor already had. So a
 * substituted element keeps its own semantics and just borrows the look.
 */
export function Button({ variant, size, render, ...props }: ButtonProps) {
  const className = button({ variant, size });
  // Called unconditionally and switched off with `enabled`, so the hook order
  // holds whether or not a caller substitutes an element.
  const substituted = useRender({
    render,
    defaultTagName: "button",
    props: { className, ...props },
    enabled: render !== undefined,
  });
  return substituted ?? <BaseButton className={className} {...props} />;
}
