import { useLocation } from "react-router-dom";

import { OVERLAY_LINKS } from "../../routing/overlays";
import { useSceneNavigate } from "../../routing/useSceneNavigate";
import { useInteractionStore } from "../../store/interactionStore";

import styles from "./OverlayTabBar.module.css";

/**
 * Top-of-screen tab bar mirroring the openable overlays. Hovering or focusing a
 * tab glows its 3D object (shared interaction id), and activating it flies in and
 * updates the URL. Real anchors, so they deep-link and middle-click like normal
 * links; the click handler intercepts left-clicks for the fly-then-commit flow.
 */
export default function OverlayTabBar() {
  const location = useLocation();
  const navigateWithFocus = useSceneNavigate();
  const setHovered = useInteractionStore((s) => s.setHovered);
  const setFocused = useInteractionStore((s) => s.setFocused);

  return (
    <nav className={styles.bar} aria-label="Places in the tent">
      {OVERLAY_LINKS.map((link) => {
        const active = location.pathname.startsWith(link.path);
        return (
          <a
            key={link.path}
            href={link.path}
            className={styles.tab}
            data-active={active || undefined}
            aria-current={active ? "page" : undefined}
            onClick={(e) => {
              // Let the browser handle modified clicks (new tab, etc.)
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
          </a>
        );
      })}
    </nav>
  );
}
