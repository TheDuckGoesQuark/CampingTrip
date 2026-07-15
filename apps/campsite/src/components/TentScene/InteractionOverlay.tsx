import { useEffect, useState } from "react";

import { useMusicStore } from "../../store/musicStore";
import { useSceneStore } from "../../store/sceneStore";

/** Visually-hidden but present for screen readers (a11y-standard clip pattern). */
const srOnly: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  borderWidth: 0,
};

/**
 * Screen-reader support for the scene. The 3D objects are intentionally not
 * tabbable — the top menu bar is the keyboard entry point, and focusing a menu
 * link highlights its object. This just announces which overlay opened via an
 * aria-live region.
 */
export default function InteractionOverlay() {
  const laptopFocused = useSceneStore((s) => s.laptopFocused);
  const notepadFocused = useSceneStore((s) => s.notepadFocused);
  const musicOpen = useMusicStore((s) => s.isOpen);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (notepadFocused) setMessage("Notepad opened");
    else if (musicOpen) setMessage("Music player opened");
    else if (laptopFocused) setMessage("Blog opened");
    else setMessage("");
  }, [laptopFocused, notepadFocused, musicOpen]);

  return (
    <div aria-live="polite" role="status" style={srOnly}>
      {message}
    </div>
  );
}
