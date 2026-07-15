import type { ComponentPropsWithoutRef } from "react";

import styles from "./Link.module.css";

export interface LinkProps extends Omit<ComponentPropsWithoutRef<"a">, "className"> {}

/**
 * Link — a brand-styled anchor (underline on hover, brand link colour). Replaces
 * Mantine's `Anchor`. No `className`/`style`; pass `href`, `target`, `rel`, etc.
 */
export function Link(props: LinkProps) {
  return <a className={styles.base} {...props} />;
}
