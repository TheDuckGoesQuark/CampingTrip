import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { Toggle, ToggleGroup } from "../../primitives/ToggleGroup";

import styles from "./SegmentedControl.module.css";

export interface SegmentedControlProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "className" | "defaultValue" | "onChange" | "children"
> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
}

export interface SegmentedControlItemProps extends Omit<
  ComponentPropsWithoutRef<"button">,
  "className" | "value"
> {
  value: string;
}

/**
 * One segment is always chosen, so the value here is a single string where Base
 * UI's is an array: an empty array and a two-entry one are both unreachable, and
 * a caller handling them would be writing for states this cannot produce.
 */
function Root({
  value,
  defaultValue,
  onValueChange,
  disabled,
  children,
  ...props
}: SegmentedControlProps) {
  return (
    <ToggleGroup
      className={styles.track}
      value={value === undefined ? undefined : [value]}
      defaultValue={defaultValue === undefined ? undefined : [defaultValue]}
      // Clicking the chosen segment clears its pressed state, which would leave
      // nothing chosen; reporting only a real choice keeps one of them chosen.
      onValueChange={(next) => next[0] !== undefined && onValueChange?.(next[0])}
      disabled={disabled}
      {...props}
    >
      {children}
    </ToggleGroup>
  );
}

function Item({ value, children, ...props }: SegmentedControlItemProps) {
  return (
    <Toggle className={styles.segment} value={value} {...props}>
      {children}
    </Toggle>
  );
}

/**
 * SegmentedControl — mutually exclusive choices drawn as one control, as toggle
 * buttons that change state in place. Where the choices are two addresses rather
 * than two states, `SegmentedNav` looks identical and is a `nav` of links; the
 * difference is what a screen reader is told and whether it survives with
 * scripts off, neither of which a visual variant could carry.
 */
export const SegmentedControl = Object.assign(Root, { Item });
