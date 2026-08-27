import type { ComponentPropsWithoutRef } from "react";

import { useRender, type UseRenderRenderProp } from "../../primitives/useRender";

import styles from "./Link.module.css";

export interface LinkProps extends Omit<ComponentPropsWithoutRef<"a">, "className"> {
  /**
   * Replace the rendered element. An app on a client-side router passes its own
   * link component (`render={<RouterLink to=… />}`) so in-app navigation stays a
   * real anchor — middle-clickable, copyable — without a full page load.
   */
  render?: UseRenderRenderProp;
}

/**
 * Link — a brand-styled anchor (underline on hover, brand link colour). Pass
 * `href`, `target`, `rel`, etc.; no `className`/`style`.
 */
export function Link({ render, ...props }: LinkProps) {
  return useRender({ render, defaultTagName: "a", props: { className: styles.base, ...props } });
}
