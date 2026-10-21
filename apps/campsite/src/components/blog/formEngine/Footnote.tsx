import { Link, Text } from "@jordanscamp/ds";
import type { ReactNode } from "react";

import { useDocumentId } from "../../../prerender/renderTarget";

import styles from "./Footnote.module.css";

const ID = "form-engine-footnote";

export function FootnoteMark() {
  const id = useDocumentId(ID);
  return (
    <sup className={styles.ref}>
      <Link href={`#${id}`} aria-label="Footnote">
        *
      </Link>
    </sup>
  );
}

export function Footnote({ children }: { children: ReactNode }) {
  const id = useDocumentId(ID);
  return (
    <Text variant="body-sm" tone="muted" id={id}>
      <span aria-hidden="true">*</span> {children}
    </Text>
  );
}
