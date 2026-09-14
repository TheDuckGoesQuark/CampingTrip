import { Check, Copy } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import { cn } from "../../utils/cn";
import { Button, type ButtonProps } from "../Button";

import styles from "./CopyButton.module.css";

/** Long enough to read "Copied", short enough that a second copy still reads. */
export const COPIED_MS = 2000;

const GLYPH_PX = 14;

export interface CopyButtonProps extends Pick<ButtonProps, "variant" | "size"> {
  value: string;
  label?: string;
  copiedLabel?: string;
}

/**
 * Its own component rather than a `copied` prop on `Button`, because holding one
 * width across two labels is layout the generic button has no business knowing
 * about: without it the row reflows mid-click and whatever sits beside this
 * jumps under the pointer.
 */
export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  variant = "solid",
  size = "md",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
  }

  return (
    <Button variant={variant} size={size} onClick={copy}>
      <span className={styles.swap}>
        {/* Hidden twice over: `visibility` for the eye, since the face has to go
            on taking up space, and `aria-hidden` for the name — which must not
            depend on a stylesheet having loaded to say one thing rather than
            both. */}
        <span className={cn(styles.face, copied && styles.spent)} aria-hidden={copied}>
          <Copy size={GLYPH_PX} weight="bold" aria-hidden />
          {label}
        </span>
        <span className={cn(styles.face, !copied && styles.spent)} aria-hidden={!copied}>
          <Check size={GLYPH_PX} weight="bold" aria-hidden />
          {copiedLabel}
        </span>
      </span>
    </Button>
  );
}
