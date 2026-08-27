import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { overlayFlight } from "./navigation";
import { applyOverlayState, type OverlayLink } from "./overlays";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Fly-then-commit navigation for the overlay tabs and the 3D objects. Opens the
 * overlay right away (starting its animation), then updates the URL once the
 * object has actually landed, so the URL reflects arrival rather than intent.
 * Reduced motion commits immediately. Deep links don't use this — the route
 * opens the overlay on mount instead.
 *
 * Arrival comes from the flight itself (`overlayFlight`) rather than a timer
 * running alongside it: a timer drifts under load, and cannot be told that the
 * flight was interrupted. `commitByMs` is only the deadline for overlays that
 * never report — the music player has no 3D move, and a covering route may not
 * have the tent mounted to animate at all.
 */
export function useSceneNavigate(): (link: OverlayLink) => void {
  const navigate = useNavigate();
  const abandonPending = useRef<(() => void) | null>(null);

  // A commit in flight when this unmounts would navigate a dead router.
  useEffect(() => () => abandonPending.current?.(), []);

  return useCallback(
    (link: OverlayLink) => {
      // Starting a second journey abandons the first, so an interrupted flight
      // never lands on a URL the visitor has already navigated away from.
      abandonPending.current?.();
      applyOverlayState(link.kind);

      if (prefersReducedMotion()) {
        navigate(link.path);
        return;
      }

      let settled = false;
      const settle = (andNavigate: boolean) => {
        if (settled) return;
        settled = true;
        unsubscribe();
        window.clearTimeout(deadline);
        abandonPending.current = null;
        if (andNavigate) navigate(link.path);
      };

      const unsubscribe = overlayFlight.subscribe((kind) => {
        if (kind === link.kind) settle(true);
      });
      const deadline = window.setTimeout(() => settle(true), link.commitByMs);

      abandonPending.current = () => settle(false);
    },
    [navigate],
  );
}
