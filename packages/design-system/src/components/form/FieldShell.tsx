import type { ReactNode } from "react";

import { Field } from "../../primitives/Field";

import styles from "./field.module.css";

export interface FieldShellProps {
  /**
   * Required, and a string: a field with no visible label is the single most
   * common accessibility defect in a form, and a placeholder is not a label —
   * it disappears exactly when a reader needs to check what they are filling
   * in.
   */
  label: string;
  /** A hint, rendered between the label and the control. */
  description?: string;
  /**
   * Set to mark the field invalid and show this message. The DS does not decide
   * what counts as an error — no validation rules, no format opinions — so the
   * caller owns the string and Base UI owns the `aria-invalid` +
   * `aria-describedby` wiring it implies.
   */
  error?: string;
  /** Marks the label, and nothing else — enforcement is the caller's. */
  optional?: boolean;
  disabled?: boolean;
  /** Identifies the field on submit. */
  name?: string;
}

/**
 * The chrome every text control in this folder shares: the label, the optional
 * marker, the hint, and the error message, wrapped in a `Field.Root` that ties
 * them to whatever control is passed as `children`.
 *
 * Internal — the barrel exports the controls, not this.
 */
export function FieldShell({
  label,
  description,
  error,
  optional,
  disabled,
  name,
  children,
}: FieldShellProps & { children: ReactNode }) {
  return (
    <Field.Root
      className={styles.root}
      name={name}
      disabled={disabled}
      invalid={error !== undefined}
    >
      <Field.Label className={styles.label}>
        {label}
        {optional ? <span className={styles.optional}>optional</span> : null}
      </Field.Label>
      {description === undefined ? null : (
        <Field.Description className={styles.description}>{description}</Field.Description>
      )}
      {children}
      {/* `match` unconditionally: the message is shown because the caller
          supplied one, not because the browser's own ValidityState says so. */}
      {error === undefined ? null : (
        <Field.Error className={styles.error} match>
          {error}
        </Field.Error>
      )}
    </Field.Root>
  );
}
