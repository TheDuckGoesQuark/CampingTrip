import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { useSceneStore } from "../store/sceneStore";
import { applyOverlayState, destinationOf, type OverlayLink } from "./overlays";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Fly-then-commit navigation for the overlay tabs and the 3D objects. Either way
 * the URL commits once the object's flight has had time to play, so it reflects
 * arrival rather than intent; what differs is whether the overlay waits with it.
 * A `coversScene` overlay does, or it would draw over the flight that opened it;
 * one that leaves the tent visible opens straight away. Reduced motion skips
 * both waits. Deep links don't use this — the route opens the overlay on mount.
 *
 * The wait is a timer rather than the animation's own completion callback: the
 * objects animate inside the Canvas, and a hidden tab pauses the rAF driving
 * them, so a flight can simply never report finishing. Since the timer is set to
 * the flight's own length, a callback could only ever tie with it — and would
 * lose outright in a backgrounded tab.
 */
export function useSceneNavigate(): (link: OverlayLink) => void {
  const navigate = useNavigate();
  const pending = useRef<number | null>(null);

  const cancelPending = useCallback(() => {
    if (pending.current !== null) {
      window.clearTimeout(pending.current);
      pending.current = null;
    }
    // A flight nobody is going to land has to be put back, or its object stays
    // in the visitor's face with no overlay to explain why.
    useSceneStore.getState().setFlyingTo(null);
  }, []);

  useEffect(() => cancelPending, [cancelPending]);

  return useCallback(
    (link: OverlayLink) => {
      // A second journey supersedes the first, so an abandoned flight doesn't
      // land its URL over the top of wherever the visitor actually went.
      cancelPending();

      const destination = destinationOf(link);
      if (prefersReducedMotion()) {
        applyOverlayState(link.kind);
        navigate(destination);
        return;
      }

      if (link.coversScene) {
        // Only the object moves for now. The route puts the overlay up on
        // arrival, by which time the window it holds is already open.
        useSceneStore.getState().setFlyingTo(link.kind);
      } else {
        applyOverlayState(link.kind);
      }

      pending.current = window.setTimeout(() => {
        pending.current = null;
        navigate(destination);
      }, link.animMs);
    },
    [navigate, cancelPending],
  );
}
