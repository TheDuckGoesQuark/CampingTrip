import { Button } from "@jordanscamp/ds";
import { useLocation } from "react-router-dom";

import { destinationOf, OVERLAY_LINKS } from "../../routing/overlays";
import { useSceneNavigate } from "../../routing/useSceneNavigate";
import { useInteractionStore } from "../../store/interactionStore";

import styles from "./OverlayTabBar.module.css";

/**
 * Top-of-screen tab bar for the places worth a permanent shortcut. Built from the DS
 * Button + a token-styled pill. Hovering/focusing a tab glows its 3D object
 * (shared interaction id); activating flies in and updates the URL. Real anchors
 * (via Base UI's `render`), so they deep-link and middle-click like normal links.
 */
export default function OverlayTabBar() {
  const location = useLocation();
  const navigateWithFocus = useSceneNavigate();
  const setHovered = useInteractionStore((s) => s.setHovered);
  const setFocused = useInteractionStore((s) => s.setFocused);

  return (
    <nav className={styles.bar} aria-label="Places in the tent">
      <div className={styles.pill}>
        {OVERLAY_LINKS.filter((link) => link.inTabBar).map((link) => {
          const active = location.pathname.startsWith(link.path);
          return (
            <Button
              key={link.path}
              render={<a href={destinationOf(link)} />}
              size="sm"
              variant={active ? "subtle" : "ghost"}
              aria-current={active ? "page" : undefined}
              onClick={(e) => {
                // Let the browser handle modified clicks (open in new tab, etc.)
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                navigateWithFocus(link);
              }}
              onMouseEnter={() => setHovered(link.objectId)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setFocused(link.objectId)}
              onBlur={() => setFocused(null)}
            >
              {link.label}
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
