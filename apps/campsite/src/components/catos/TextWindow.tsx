import { Text, Window } from "@jordanscamp/ds";

import type { DesktopItem } from "../../types/desktop";
import type { WindowFrameProps } from "./windowFrame";

import styles from "./catos.module.css";

export interface TextWindowProps extends WindowFrameProps {
  item: Extract<DesktopItem, { kind: "text" }>;
  onClose: () => void;
}

/**
 * A plain-text viewer: a mode strip where a browser keeps its tabs, and no more.
 * Wide enough that a line of notes does not soft-wrap mid-phrase, which reads as
 * a layout fault rather than as a text file.
 */
export default function TextWindow({ item, onClose, ...frame }: TextWindowProps) {
  return (
    <Window size="md" {...frame}>
      <Window.TitleBar title={item.label} onClose={onClose} />
      <Window.Toolbar>
        <Text variant="label" tone="muted" as="span">
          {item.mode}
        </Text>
        <Window.Separator />
        <Text variant="label" tone="muted" as="span">
          read only
        </Text>
      </Window.Toolbar>
      <Window.Body>
        <div className={styles.textSurface}>
          <pre className={styles.textBody}>{item.body}</pre>
        </div>
      </Window.Body>
    </Window>
  );
}
