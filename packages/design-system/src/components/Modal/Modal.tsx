import { Children, isValidElement, type ReactNode } from "react";

import { Dialog } from "../../primitives/Dialog";
import { cn } from "../../utils/cn";

import styles from "./Modal.module.css";

export type ModalVariant = "centered" | "takeover" | "bare";
export type ModalSize = "sm" | "md" | "lg";

export interface ModalProps {
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean;
  /** Fired on every open-state change (trigger, backdrop, Escape, close button). */
  onOpenChange?: (open: boolean) => void;
  /** `centered` card (default), full-viewport `takeover`, or `bare` (centered +
   *  focus-trapped, no card chrome — the content supplies its own body). */
  variant?: ModalVariant;
  /** Width tier for the centered card. Ignored for `takeover`/`bare`. */
  size?: ModalSize;
  /** Accessible name when no `Modal.Title` is rendered. */
  ariaLabel?: string;
  children?: ReactNode;
}

/** Base UI's Dialog.Trigger — keeps trigger + popup under one Root so focus
 *  returns to the trigger on close for free. */
const Trigger = Dialog.Trigger;

function Root({
  open,
  defaultOpen,
  onOpenChange,
  variant = "centered",
  size = "md",
  ariaLabel,
  children,
}: ModalProps) {
  // A Trigger sits under Dialog.Root but outside the portal; everything else
  // goes inside the Popup. Partition the flat children (citrus2 ContentModal shape).
  const triggers: ReactNode[] = [];
  const content: ReactNode[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === Trigger) triggers.push(child);
    else content.push(child);
  });

  const popupClass = cn(
    styles.popup,
    variant === "takeover" && styles.takeover,
    variant === "bare" && styles.bare,
    variant === "centered" && [styles.centered, styles[size]],
  );

  return (
    <Dialog.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {triggers}
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup aria-label={ariaLabel} className={popupClass}>
          {content}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
Root.displayName = "Modal";

function Header({
  children,
  hideClose = false,
  closeLabel = "Close",
}: {
  children?: ReactNode;
  hideClose?: boolean;
  closeLabel?: string;
}) {
  return (
    <div className={styles.header}>
      <div className={styles.headerContent}>{children}</div>
      {hideClose ? null : (
        <Dialog.Close aria-label={closeLabel} className={styles.closeButton}>
          ✕
        </Dialog.Close>
      )}
    </div>
  );
}
Header.displayName = "Modal.Header";

function Title({ children }: { children?: ReactNode }) {
  return <Dialog.Title>{children}</Dialog.Title>;
}
Title.displayName = "Modal.Title";

function Body({ children }: { children?: ReactNode }) {
  return <div className={styles.body}>{children}</div>;
}
Body.displayName = "Modal.Body";

function Footer({ children }: { children?: ReactNode }) {
  return <div className={styles.footer}>{children}</div>;
}
Footer.displayName = "Modal.Footer";

/**
 * Modal — a dialog on Base UI's Dialog primitive: focus trap, focus-return,
 * Escape + click-outside dismissal, and ARIA wiring come for free. `centered`
 * card (with `size`) or full-viewport `takeover`. Compound: render any subset of
 * `Modal.Trigger` / `Modal.Header` / `Modal.Title` / `Modal.Body` /
 * `Modal.Footer` / `Modal.Close`, in any order.
 */
export const Modal = Object.assign(Root, {
  Trigger,
  Close: Dialog.Close,
  Header,
  Title,
  Body,
  Footer,
});
