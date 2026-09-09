import { Text, Window } from "@jordanscamp/ds";

import { desktopItemSlug } from "../../data/desktopItems";
import { useSessionStore } from "../../store/sessionStore";
import type { DesktopItem } from "../../types/desktop";
import type { WindowFrameProps } from "./windowFrame";

import styles from "./catos.module.css";

export interface TextWindowProps extends WindowFrameProps {
  item: Extract<DesktopItem, { kind: "text" }>;
  onClose: () => void;
}

/**
 * A plain-text editor: a mode strip where a browser keeps its tabs, and no more.
 * Wide enough that a line of notes does not soft-wrap mid-phrase, which reads as
 * a layout fault rather than as a text file.
 *
 * Typing goes straight to the session store, so there is no save — which is why
 * Revert is the only control the strip offers, and why it is disabled until
 * there is something to revert to.
 */
export default function TextWindow({ item, onClose, ...frame }: TextWindowProps) {
  const slug = desktopItemSlug(item);
  const edited = useSessionStore((s) => s.textEdits[slug]);
  const editText = useSessionStore((s) => s.editText);
  const revertText = useSessionStore((s) => s.revertText);
  const dirty = edited !== undefined && edited !== item.body;

  return (
    <Window size="md" {...frame}>
      <Window.TitleBar title={item.label} onClose={onClose} />
      <Window.Toolbar>
        <Text variant="label" tone="muted" as="span">
          {item.mode}
        </Text>
        <Window.Separator />
        <Window.ToolButton
          label="Revert"
          icon="reload"
          onClick={dirty ? () => revertText(slug) : undefined}
        />
      </Window.Toolbar>
      <Window.Body>
        <textarea
          className={styles.textBody}
          aria-label={item.label}
          spellCheck={false}
          value={edited ?? item.body}
          onChange={(event) => editText(slug, event.target.value)}
        />
      </Window.Body>
    </Window>
  );
}
