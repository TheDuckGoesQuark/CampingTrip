import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { useRender, type UseRenderRenderProp } from "../../primitives/useRender";

import styles from "./SegmentedNav.module.css";

/** Two `nav`s on a page are told apart by name alone, so there is no unnamed one. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

export type SegmentedNavProps = Omit<
  ComponentPropsWithoutRef<"nav">,
  "className" | "children" | "aria-label" | "aria-labelledby"
> &
  Named & { children: ReactNode };

export interface SegmentedNavItemProps extends Omit<ComponentPropsWithoutRef<"span">, "className"> {
  /** `render={<a href=… />}`, or an app's own link component. */
  render?: UseRenderRenderProp;
  /** The segment standing for the page in view. Give it no `render`. */
  current?: boolean;
}

function Root({ children, ...props }: SegmentedNavProps) {
  return (
    <nav {...props}>
      <ul className={styles.track}>{children}</ul>
    </nav>
  );
}

/**
 * The current segment is a `span`, never a link: a link back to where you
 * already are is no destination, and `aria-current` is what carries the state
 * to a reader who cannot see the fill.
 */
function Item({ current, render, children, ...props }: SegmentedNavItemProps) {
  const segment = useRender({
    render,
    defaultTagName: "span",
    props: {
      className: styles.segment,
      children,
      ...(current ? { "aria-current": "page" as const } : {}),
      ...props,
    },
  });
  return <li>{segment}</li>;
}

/**
 * SegmentedNav — a small set of addresses drawn as one control, with the segment
 * for the page in view filled in. A `nav` of plain links, so it needs no scripts
 * to work and a shared link opens the segment it names.
 */
export const SegmentedNav = Object.assign(Root, { Item });
