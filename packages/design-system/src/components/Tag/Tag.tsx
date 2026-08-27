import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";

import { useRender, type UseRenderRenderProp } from "../../primitives/useRender";

import styles from "./Tag.module.css";

const tag = cva(styles.base, {
  variants: {
    selected: { true: styles.selected, false: "" },
  },
  defaultVariants: { selected: false },
});

export interface TagProps
  extends Omit<ComponentPropsWithoutRef<"span">, "className">, VariantProps<typeof tag> {
  /** How many things carry this tag. Omitted renders the label alone. */
  count?: number;
  /**
   * Replace the rendered element — `render={<a href=… />}` for a navigable tag.
   * A tag standing for the page you are already on is better left a `span` with
   * `aria-current="page"` than a link to here.
   */
  render?: UseRenderRenderProp;
}

/**
 * Tag — a topic label. Parallel to `Badge` rather than a variant of it: a Badge
 * reports status and is never a control, whereas a Tag is routinely a link and
 * carries a selected state, so it needs its own element and ARIA.
 */
export function Tag({ selected, count, children, render, ...props }: TagProps) {
  return useRender({
    render,
    defaultTagName: "span",
    props: {
      className: tag({ selected }),
      children: (
        <>
          {children}
          {count !== undefined && <span className={styles.count}>{count}</span>}
        </>
      ),
      ...props,
    },
  });
}
