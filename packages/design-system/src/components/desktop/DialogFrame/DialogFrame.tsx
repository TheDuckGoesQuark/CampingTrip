import { type ReactNode, useEffect, useId, useRef } from "react";

import { Text } from "../../Text";

import styles from "./DialogFrame.module.css";

export interface DialogFrameProps {
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}

/**
 * Unexported: the one shape `AlertDialog` and `LoadingDialog` are both cut from.
 *
 * Not built on `Modal`, which portals to the body and traps focus — a dialog of
 * this era blocked its own application, not the machine, so this covers its
 * nearest positioned ancestor instead. **A call site must establish a containing
 * block**; without `position: relative` above it, the scrim escapes to the page.
 */
export default function DialogFrame({ title, children, actions }: DialogFrameProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  // Whatever was focused is now behind this, and would otherwise stay focused.
  useEffect(() => {
    panel.current?.focus();
  }, []);

  return (
    <div className={styles.scrim}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={panel}
      >
        <div className={styles.title}>
          <Text variant="label" as="span" id={titleId}>
            {title}
          </Text>
        </div>
        <div className={styles.body}>{children}</div>
        {actions === undefined ? null : <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
}
