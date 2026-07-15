import { useEffect, useState } from "react";

import { INTERACTABLES } from "../../data/interactables";
import { useInteractionStore } from "../../store/interactionStore";
import { useMusicStore } from "../../store/musicStore";
import { useSceneStore } from "../../store/sceneStore";

/** Visually-hidden but focusable (a11y-standard clip pattern). */
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
 * Keyboard + screen-reader access to the 3D scene. Renders one focusable button
 * per interactive object (from the INTERACTABLES registry); focusing a button
 * highlights the object in the scene (the visible focus cue), Enter/Space
 * activates it via the `scene-activate` event. Also provides a skip link to the
 * blog and an aria-live region announcing which overlay opened.
 */
export default function InteractionOverlay() {
  const setFocused = useInteractionStore((s) => s.setFocused);

  return (
    <div
      role="toolbar"
      aria-label="Interactive objects in tent scene"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        overflow: "visible",
        zIndex: 10,
      }}
    >
      <SkipToBlogLink />
      <LiveAnnouncer />
      {INTERACTABLES.map((item) => (
        <button
          key={item.id}
          aria-label={item.label}
          aria-description={item.description}
          tabIndex={0}
          onFocus={() => setFocused(item.id)}
          onBlur={() => setFocused(null)}
          onKeyDown={(e) => {
            if (!item.actionable) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent("scene-activate", { detail: { id: item.id } }));
            }
          }}
          style={srOnly}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/** Keyboard/SR shortcut straight to the blog. Visible only when focused. */
function SkipToBlogLink() {
  const [focused, setFocused] = useState(false);
  return (
    <button
      type="button"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onClick={() => useSceneStore.getState().setLaptopFocused(true)}
      style={
        focused
          ? {
              position: "fixed",
              top: 8,
              left: 8,
              zIndex: 60,
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid rgba(255,179,71,0.5)",
              background: "rgba(20,18,30,0.95)",
              color: "#ffb347",
              font: "inherit",
              cursor: "pointer",
            }
          : srOnly
      }
    >
      Skip to blog
    </button>
  );
}

/** Announces which overlay is open to assistive tech. */
function LiveAnnouncer() {
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
