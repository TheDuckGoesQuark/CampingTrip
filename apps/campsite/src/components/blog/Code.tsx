import type { ReactNode } from "react";

import styles from "./Code.module.css";

/** Thirty lines of code did not justify a syntax-highlighting dependency. */
const TOKEN =
  /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("[^"]*")|(--[\w-]+)|(<\/?[A-Za-z][\w.]*|\/>)|([A-Za-z][\w-]*(?=\s*[=:]))/g;

export default function Code({ code }: { code: string }) {
  const parts: ReactNode[] = [];
  const scanner = new RegExp(TOKEN.source, "g");
  let cursor = 0;
  let match = scanner.exec(code);

  while (match) {
    if (match.index > cursor) parts.push(code.slice(cursor, match.index));
    const kind = match[1]
      ? styles.comment
      : match[2]
        ? styles.string
        : match[3]
          ? styles.prop
          : match[4]
            ? styles.element
            : styles.attr;
    parts.push(
      <span key={match.index} className={kind}>
        {match[0]}
      </span>,
    );
    cursor = match.index + match[0].length;
    match = scanner.exec(code);
  }
  parts.push(code.slice(cursor));

  return <pre className={styles.code}>{parts}</pre>;
}
