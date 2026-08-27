import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

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
 * animation has had time to play, so the URL reflects arrival rather than intent.
 * Reduced motion commits immediately. Deep links don't use this — the route
 * opens the overlay on mount instead.
 *
 * The hold is a timer rather than the animation's own completion callback: the
 * objects animate inside the Canvas, and a hidden tab pauses the rAF driving
 * them, so a flight can simply never report finishing. A timer is approximate
 * but it always fires.
 */
export function useSceneNavigate(): (link: OverlayLink) => void {
  const navigate = useNavigate();
  const pending = useRef<number | null>(null);

  const cancelPending = useCallback(() => {
    if (pending.current !== null) {
      window.clearTimeout(pending.current);
      pending.current = null;
    }
  }, []);

  useEffect(() => cancelPending, [cancelPending]);

  return useCallback(
    (link: OverlayLink) => {
      // A second journey supersedes the first, so an abandoned flight doesn't
      // land its URL over the top of wherever the visitor actually went.
      cancelPending();
      applyOverlayState(link.kind);

      if (prefersReducedMotion()) {
        navigate(link.path);
        return;
      }
      pending.current = window.setTimeout(() => {
        pending.current = null;
        navigate(link.path);
      }, link.animMs);
    },
    [navigate, cancelPending],
  );
}
