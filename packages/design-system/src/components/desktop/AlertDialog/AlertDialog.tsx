import { Children, isValidElement, type ReactNode } from "react";

import { DialogFrame } from "../DialogFrame";

import styles from "./AlertDialog.module.css";

export interface AlertDialogProps {
  children?: ReactNode;
}

function Title({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
Title.displayName = "AlertDialog.Title";

function Icon({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
Icon.displayName = "AlertDialog.Icon";

function Body({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
Body.displayName = "AlertDialog.Body";

function Actions({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
Actions.displayName = "AlertDialog.Actions";

/**
 * The outcome of something the person just did, and what they can do next.
 * Slots are matched by type and may be given in any order — the same partition
 * `Modal` does for its trigger.
 *
 * The icon is always brand green and always `aria-hidden`: what happened is
 * carried by the title, the body and the glyph's own shape, never by colour.
 */
function Root({ children }: AlertDialogProps) {
  const slots = new Map<unknown, ReactNode>();
  Children.forEach(children, (child) => {
    if (isValidElement(child)) slots.set(child.type, child);
  });

  const icon = slots.get(Icon);
  const actions = slots.get(Actions);

  return (
    <DialogFrame title={slots.get(Title)} actions={actions}>
      <div className={styles.layout}>
        {icon === undefined ? null : (
          <div className={styles.icon} aria-hidden>
            {icon}
          </div>
        )}
        <div className={styles.content}>{slots.get(Body)}</div>
      </div>
    </DialogFrame>
  );
}
Root.displayName = "AlertDialog";

export const AlertDialog = Object.assign(Root, { Title, Icon, Body, Actions });
