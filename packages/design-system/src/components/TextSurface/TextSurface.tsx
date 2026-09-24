import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";

import styles from "./TextSurface.module.css";

const surface = cva(styles.base, {
  variants: {
    face: { text: styles.faceText, mono: styles.faceMono },
    fill: { frame: styles.fillFrame, content: styles.fillContent },
  },
  defaultVariants: { face: "text", fill: "frame" },
});

type NativeProps = Omit<
  ComponentPropsWithoutRef<"textarea">,
  // `cols`/`rows` size a control in characters and lines, which is the escape
  // hatch the design system refuses everywhere else: this one is sized by the
  // frame it sits in or by what is typed into it.
  "className" | "style" | "cols" | "rows"
>;

/**
 * There is no visible label, because the window's title bar is the name of what
 * is being edited. Requiring one of the two ARIA spellings keeps that from
 * meaning no name at all, which is what a bare `textarea` here would be.
 */
type Labelled =
  | { "aria-label": string; "aria-labelledby"?: never }
  | { "aria-labelledby": string; "aria-label"?: never };

export type TextSurfaceProps = NativeProps & VariantProps<typeof surface> & Labelled;

/**
 * TextSurface — a text control that a window frames, as opposed to `TextArea`,
 * which is a form field carrying its own label, hint, error and border. The
 * difference is the shell, and the shell is most of what `TextArea` is, so they
 * are two components rather than one with the shell switched off.
 *
 * `face` picks the type. `fill` says how the control stands to its window: the
 * whole of its body, or a pane beside other chrome.
 */
export function TextSurface({ face, fill, ...props }: TextSurfaceProps) {
  return <textarea className={surface({ face, fill })} {...props} />;
}
