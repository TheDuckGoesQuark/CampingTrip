import type { BlogPage } from "../../data/blogPages";
import { contactLabel, contactMailto } from "../../data/contactEmail";
import { useSceneStore } from "../../store/sceneStore";
import AboutWindow from "./AboutWindow";
import BinWindow from "./BinWindow";
import BrowserWindow from "./BrowserWindow";
import MouseMailWindow from "./MouseMailWindow";
import PreviewWindow from "./PreviewWindow";
import TextWindow from "./TextWindow";
import VideoWindow from "./VideoWindow";
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
  // Only MouseMail reads this, but a hook cannot live inside the switch below.
  const preset = useSceneStore((s) => s.mailPreset);

  if (page.kind === "about") return <AboutWindow onClose={onClose} {...frame} />;
  if (page.kind !== "desk") return <BrowserWindow page={page} onClose={onClose} {...frame} />;

  const { item } = page;
  switch (item.kind) {
    case "image":
      return <PreviewWindow item={item} onClose={onClose} {...frame} />;
    case "text":
      return <TextWindow item={item} onClose={onClose} {...frame} />;
    case "video":
      return <VideoWindow item={item} onClose={onClose} {...frame} />;
    case "bin":
      return <BinWindow item={item} onClose={onClose} {...frame} />;
    case "mail":
      // Unreachable — `resolveBlogPage` excluded it. Here to narrow the type.
      return contactMailto === undefined ? null : (
        <MouseMailWindow
          mailto={contactMailto}
          emailLabel={contactLabel ?? contactMailto}
          preset={preset}
          onClose={onClose}
          {...frame}
        />
      );
    // An app launches something else; it is never itself a desk window.
    case "app":
      return null;
  }
}
