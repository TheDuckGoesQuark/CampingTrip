import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";

import { Field } from "../../../primitives/Field";
import { cn } from "../../../utils/cn";
import { FieldShell, type FieldShellProps } from "../FieldShell";

import styles from "../field.module.css";

const control = cva(styles.control, {
  variants: {
    size: { sm: styles.sm, md: styles.md },
  },
  defaultVariants: { size: "md" },
});

type ControlProps = Omit<
  ComponentPropsWithoutRef<typeof Field.Control>,
  // `size` is dropped for the cva axis below, and would not survive anyway: the
  // native attribute is a character-count width, which is the escape hatch the
  // DS refuses on every other component.
  "className" | "render" | "type" | "name" | "disabled" | "size"
>;

export interface TextAreaProps extends ControlProps, FieldShellProps, VariantProps<typeof control> {
  /** Visible lines before scrolling. The control still grows by drag. */
  rows?: number;
}

/**
 * TextArea — a multi-line text control with its label, hint and error.
 *
 * `Field.Control` renders an `input` by default, so the element is substituted
 * via Base UI's `render`. Unlike `Button`, substituting here costs nothing: a
 * `textarea` is already a labelable form control, so there are no semantics for
 * Base UI to overwrite.
 */
export function TextArea({
  label,
  description,
  error,
  optional,
  disabled,
  name,
  size,
  rows = 4,
  ...props
}: TextAreaProps) {
  return (
    <FieldShell
      label={label}
      description={description}
      error={error}
      optional={optional}
      disabled={disabled}
      name={name}
    >
      <Field.Control
        className={cn(control({ size }), styles.textarea)}
        render={<textarea rows={rows} />}
        {...props}
      />
    </FieldShell>
  );
}
