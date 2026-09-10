import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";

import { Field } from "../../../primitives/Field";
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

export interface TextFieldProps
  extends ControlProps, FieldShellProps, VariantProps<typeof control> {
  /**
   * A closed set. `password` is absent deliberately — a password field wants a
   * reveal toggle, a manager-friendly `autoComplete` and its own tests, so it
   * is a component rather than a value here. `number` is absent because a
   * spinner is `Base UI`'s `NumberField`, not an input with a different `type`.
   */
  type?: "text" | "email" | "url" | "tel" | "search";
}

/**
 * TextField — a single-line text control with its label, hint and error.
 *
 * The label is a required prop rather than a slot, so an unlabelled field
 * cannot be built. Multi-line input is `TextArea`, not a flag here: the two
 * differ in resize behaviour, default height and which native element they
 * need, and a `multiline` boolean would make every one of those conditional.
 */
export function TextField({
  label,
  description,
  error,
  optional,
  disabled,
  name,
  size,
  type = "text",
  ...props
}: TextFieldProps) {
  return (
    <FieldShell
      label={label}
      description={description}
      error={error}
      optional={optional}
      disabled={disabled}
      name={name}
    >
      <Field.Control className={control({ size })} type={type} {...props} />
    </FieldShell>
  );
}
