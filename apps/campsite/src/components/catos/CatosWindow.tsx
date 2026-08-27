import type { BlogPage } from "../../data/blogPages";
import BinWindow from "./BinWindow";
import BrowserWindow from "./BrowserWindow";
import PreviewWindow from "./PreviewWindow";
import TextWindow from "./TextWindow";
import type { WindowFrameProps } from "./windowFrame";

export interface CatosWindowProps extends WindowFrameProps {
  page: BlogPage;
  /** Where each window's red light goes. */
  onClose: () => void;
}

/**
 * Picks the window a page opens in. This is the whole point of `Window` taking
 * its kind from its subparts rather than a prop: adding a kind of window means
 * adding a case here and a component, and nothing in the design system moves.
 */
export default function CatosWindow({ page, onClose, ...frame }: CatosWindowProps) {
  if (page.kind !== "desk") return <BrowserWindow page={page} onClose={onClose} {...frame} />;

  const { item } = page;
  switch (item.kind) {
    case "image":
      return <PreviewWindow item={item} onClose={onClose} {...frame} />;
    case "text":
      return <TextWindow item={item} onClose={onClose} {...frame} />;
    case "bin":
      return <BinWindow item={item} onClose={onClose} {...frame} />;
    // An app launches something else; it is never itself a window.
    case "app":
      return null;
  }
}
