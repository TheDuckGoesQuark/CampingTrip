import { Text, Window } from "@jordanscamp/ds";

import type { DesktopItem } from "../../types/desktop";
import SmittensPhoto from "./SmittensPhoto";
import type { WindowFrameProps } from "./windowFrame";

import styles from "./catos.module.css";

export interface PreviewWindowProps extends WindowFrameProps {
  item: Extract<DesktopItem, { kind: "image" }>;
  onClose: () => void;
}

/**
 * An image viewer. Same frame as the browser, but a toolbar and a status bar in
 * place of the tab strip and address bar — which is what makes it a viewer.
 *
 * The zoom and paging controls are inert: there is one image and it fits. They
 * render disabled rather than being omitted, because a viewer without them reads
 * as unfinished, and a control that lies about working is worse than a grey one.
 */
export default function PreviewWindow({ item, onClose, ...frame }: PreviewWindowProps) {
  return (
    <Window size="md" {...frame}>
      <Window.TitleBar title={`${item.label} — Preview`} onClose={onClose} />
      <Window.Toolbar>
        <Window.ToolButton label="Zoom out" icon="minus" />
        <Window.ToolButton label="Zoom in" icon="plus" />
        <Window.Separator />
        <Window.ToolButton label="Previous image" icon="chevron-left" />
        <Window.ToolButton label="Next image" icon="chevron-right" />
      </Window.Toolbar>
      <Window.Body inset>
        <figure className={styles.photoFigure}>
          <div className={styles.photo}>
            <SmittensPhoto />
          </div>
          <figcaption className={styles.photoCaption}>
            <Text variant="body-sm" tone="muted" align="center">
              {item.caption}
            </Text>
          </figcaption>
        </figure>
      </Window.Body>
      <Window.StatusBar>
        <span>{item.label}</span>
        <span>·</span>
        <span>{item.dimensions}</span>
        <span>·</span>
        <span>{item.size}</span>
        <span className={styles.statusSpacer}>100%</span>
      </Window.StatusBar>
    </Window>
  );
}
