import { TextField } from "@jordanscamp/ds";
import type { ReactNode } from "react";

import { SUBJECT_LIMIT } from "./submitFeedback";

import styles from "./contact.module.css";

/**
 * MouseMail's chrome as compound parts, so a message being written and a
 * message being shown share one layout: the header band, then the surface.
 * The compose form fills them with fields and an editor; a preview fills them
 * with read-only values and the message as it arrived. Nothing here knows
 * which it is in.
 */
function Stage({ children }: { children: ReactNode }) {
  return <div className={styles.stage}>{children}</div>;
}

function Headers({ children }: { children: ReactNode }) {
  return <div className={styles.headers}>{children}</div>;
}

interface HeaderFieldProps {
  value: string;
  /** Absent means the field is read-only: a fact shown in a field, not an input. */
  onValueChange?: (value: string) => void;
}

/** A field rather than a caption, so the address keeps a tab stop and stays selectable. */
function To({ value, onValueChange }: HeaderFieldProps) {
  return (
    <TextField label="To" value={value} onValueChange={onValueChange} readOnly={!onValueChange} />
  );
}

function From({ value, onValueChange, optional }: HeaderFieldProps & { optional?: string }) {
  return (
    <TextField
      label="From"
      type="email"
      optional={optional}
      value={value}
      onValueChange={onValueChange}
      readOnly={!onValueChange}
    />
  );
}

function Subject({ value, onValueChange }: HeaderFieldProps) {
  return (
    <TextField
      label="Subject"
      value={value}
      onValueChange={onValueChange}
      readOnly={!onValueChange}
      maxLength={SUBJECT_LIMIT}
    />
  );
}

/** The writing surface's place. What fills it is the caller's: an editor, or a message. */
function Body({ children }: { children: ReactNode }) {
  return <div className={styles.surface}>{children}</div>;
}

export const MouseMail = Object.assign(Stage, { Headers, To, From, Subject, Body });
