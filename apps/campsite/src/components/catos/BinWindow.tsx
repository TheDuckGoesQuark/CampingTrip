import { Icon, Text, Window } from "@jordanscamp/ds";

import type { DesktopItem } from "../../types/desktop";
import type { WindowFrameProps } from "./windowFrame";

import styles from "./catos.module.css";

export interface BinWindowProps extends WindowFrameProps {
  item: Extract<DesktopItem, { kind: "bin" }>;
  onClose: () => void;
}

/**
 * The bin, as a listing. Emptying it is not offered: the joke is the contents,
 * and a working Empty control would delete them for everyone who visits next.
 */
export default function BinWindow({ item, onClose, ...frame }: BinWindowProps) {
  const { contents } = item;

  return (
    <Window size="md" {...frame}>
      <Window.TitleBar title={item.label} onClose={onClose} />
      <Window.Toolbar>
        <Text variant="label" tone="muted" as="span">
          {contents.length} {contents.length === 1 ? "item" : "items"}
        </Text>
      </Window.Toolbar>
      <Window.Body>
        <ul className={styles.binList}>
          {contents.map((entry) => (
            <li key={entry} className={styles.binRow}>
              <Icon name="document" size="sm" />
              <Text variant="body-sm" as="span">
                {entry}
              </Text>
            </li>
          ))}
        </ul>
        <div className={styles.binNote}>
          <Text variant="body-sm" tone="muted">
            Nothing in here is going anywhere. Some of it is load-bearing.
          </Text>
        </div>
      </Window.Body>
      <Window.StatusBar>Items in the Bin are kept for 60 days.</Window.StatusBar>
    </Window>
  );
}
