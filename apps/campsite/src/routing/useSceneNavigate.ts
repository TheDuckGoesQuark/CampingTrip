import { useCallback } from "react";
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
 */
export function useSceneNavigate(): (link: OverlayLink) => void {
  const navigate = useNavigate();
  return useCallback(
    (link: OverlayLink) => {
      applyOverlayState(link.kind);
      const delay = prefersReducedMotion() ? 0 : link.animMs;
      window.setTimeout(() => navigate(link.path), delay);
    },
    [navigate],
  );
}
